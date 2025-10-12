from torch.utils.data import Dataset
import pandas as pd
import torch
import re # Import re for string cleaning

# Helper function to parse string representations of lists
def parse_list_string(list_str):
    # Remove brackets, quotes, and split by comma, then strip whitespace
    return [item.strip().replace("'", "") for item in list_str.strip("[]").split(', ')]

# For ATE part
class dataset_ATM(Dataset):
    def __init__(self, df, tokenizer):
        self.df = df
        self.tokenizer = tokenizer

    def __getitem__(self, idx):
        # Assuming the first three columns are 'tokens', 'tags', 'polarities'
        tokens_str, tags_str, pols_str = self.df.iloc[idx, :3].values

        # Parse the string representations of lists
        tokens = parse_list_string(tokens_str)
        tags = [int(x) for x in parse_list_string(tags_str)]
        pols = [int(x) for x in parse_list_string(pols_str)]

        bert_tokens = []
        bert_tags = []
        bert_pols = [] # Keep for consistency with original structure if needed elsewhere

        # Tokenize each word and assign corresponding tag/polarity
        for i in range(len(tokens)):
            # Handle empty strings if any result from parsing
            if not tokens[i]:
                continue
            
            # Tokenize the individual word
            sub_tokens = self.tokenizer.tokenize(tokens[i])
            bert_tokens.extend(sub_tokens)
            
            # Assign the tag and polarity to all sub-tokens of the current word
            bert_tags.extend([tags[i]] * len(sub_tokens))
            bert_pols.extend([pols[i]] * len(sub_tokens))
        
        # Convert BERT tokens to their IDs
        bert_ids = self.tokenizer.convert_tokens_to_ids(bert_tokens)

        # Convert to tensors
        ids_tensor = torch.tensor(bert_ids, dtype=torch.long)
        tags_tensor = torch.tensor(bert_tags, dtype=torch.long)
        pols_tensor = torch.tensor(bert_pols, dtype=torch.long)

        # For ATE, we return the original tokens (for debugging/reconstruction),
        # input IDs, and the corresponding tags.
        return bert_tokens, ids_tensor, tags_tensor, pols_tensor

    def __len__(self):
        return len(self.df)

# For ABSA part - REVISED TO CREATE (REVIEW, ASPECT, SENTIMENT) SAMPLES
class dataset_ABSA(Dataset):
    def __init__(self, df, tokenizer):
        self.tokenizer = tokenizer
        self.data = [] # This will store preprocessed (input_ids, token_type_ids, label_id) tuples

        # Iterate through each row of the dataframe to create ABSA-specific samples
        for idx in range(len(df)):
            tokens_str, tags_str, pols_str = df.iloc[idx, :3].values

            # Parse the string representations of lists
            original_tokens = parse_list_string(tokens_str)
            tags = [int(x) for x in parse_list_string(tags_str)]
            polarities = [int(x) for x in parse_list_string(pols_str)]

            # Find aspect terms and their corresponding polarities
            aspect_terms_with_sentiment = []
            current_aspect_tokens = []
            current_aspect_polarity = -1 # Default to -1

            for i in range(len(original_tokens)):
                token = original_tokens[i]
                tag = tags[i]
                polarity = polarities[i]

                if tag == 1: # 'b-term'
                    if current_aspect_tokens: # If previous aspect was being tracked, save it
                        aspect_str = " ".join(current_aspect_tokens)
                        if current_aspect_polarity != -1: # Only add if it has a valid sentiment
                            aspect_terms_with_sentiment.append((aspect_str, current_aspect_polarity))
                    
                    current_aspect_tokens = [token]
                    current_aspect_polarity = polarity # Start new aspect's polarity
                elif tag == 2: # 'i-term'
                    current_aspect_tokens.append(token)
                    # For I-term, the polarity usually applies to the whole aspect.
                    # We take the polarity of the B-term or the most recent non-negative polarity.
                    # This assumes consistent tagging within an aspect.
                    if polarity != -1: # Update polarity if a valid one is found within the aspect
                        current_aspect_polarity = polarity
                else: # 'non-aspect' (0)
                    if current_aspect_tokens: # If an aspect was being tracked, save it
                        aspect_str = " ".join(current_aspect_tokens)
                        if current_aspect_polarity != -1: # Only add if it has a valid sentiment
                            aspect_terms_with_sentiment.append((aspect_str, current_aspect_polarity))
                    current_aspect_tokens = []
                    current_aspect_polarity = -1 # Reset

            # Add any trailing aspect term after loop finishes
            if current_aspect_tokens:
                aspect_str = " ".join(current_aspect_tokens)
                if current_aspect_polarity != -1:
                    aspect_terms_with_sentiment.append((aspect_str, current_aspect_polarity))

            # Now, for each identified (aspect, sentiment) pair, create a sample for ABSA training
            review_text = " ".join(original_tokens) # Reconstruct the full review text

            for aspect_term, sentiment_label in aspect_terms_with_sentiment:
                # Construct the input for BERT: [CLS] review_text [SEP] aspect_term [SEP]
                # tokenizer.encode_plus handles special tokens and token_type_ids automatically
                encoded_input = self.tokenizer.encode_plus(
                    review_text,
                    aspect_term,
                    add_special_tokens=True,
                    max_length=128, # Use a reasonable max_length, adjust if your reviews are longer
                    padding='max_length',
                    truncation=True,
                    return_tensors='pt',
                    return_token_type_ids=True,
                    return_attention_mask=True
                )
                
                # Squeeze to remove batch dimension (since we're processing one sample at a time)
                input_ids = encoded_input['input_ids'].squeeze(0)
                token_type_ids = encoded_input['token_type_ids'].squeeze(0)
                attention_mask = encoded_input['attention_mask'].squeeze(0)
                
                # The sentiment_label is already 0, 1, or 2 (Negative, Neutral, Positive)
                # We filter out -1 earlier, so this should be safe.
                sentiment_tensor = torch.tensor(sentiment_label, dtype=torch.long)

                # Store the prepared sample
                self.data.append((input_ids, token_type_ids, attention_mask, sentiment_tensor))

    def __getitem__(self, idx):
        # Return the preprocessed tensors directly
        input_ids, token_type_ids, attention_mask, sentiment_tensor = self.data[idx]
        return input_ids, token_type_ids, attention_mask, sentiment_tensor

    def __len__(self):
        return len(self.data)
