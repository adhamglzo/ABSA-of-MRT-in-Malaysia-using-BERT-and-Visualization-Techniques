# backend/model_loader.py

import os
import torch
from transformers import BertTokenizer, BertConfig
from .bert_ate_absa_models import bert_ATE, bert_ABSA
import re
import pandas as pd

# Global variables for models and tokenizer
ate_tokenizer = None
absa_tokenizer = None
ate_model = None
absa_model = None
device = None
aspect_dictionary = {}

# Declare these as global placeholders that will be populated by _load_absa_models_once
ATE_ID2LABEL = None
ABSA_ID2LABEL = None


# --- NEW: Function to load models and dictionary once ---
def _load_absa_models_once():
    global ate_tokenizer, absa_tokenizer, ate_model, absa_model, device, aspect_dictionary
    global ATE_ID2LABEL, ABSA_ID2LABEL # Declare these as global inside the loading function

    # Set device (GPU if available, else CPU)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    # Load Tokenizers
    ate_tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    absa_tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    print("Tokenizers 'bert-base-uncased' loaded.")

    # Define Model Configurations and Mappings - these were here previously,
    # but let's make sure they are explicitly assigned to globals
    # ATE Model (Aspect Term Extraction)
    ATE_LABELS = ['non-aspect', 'b-term', 'i-term']
    ATE_ID2LABEL = {i: label for i, label in enumerate(ATE_LABELS)} # Assign to global
    ATE_LABEL2ID = {label: i for i, label in enumerate(ATE_LABELS)}
    # NUM_ATE_LABELS = len(ATE_LABELS) # This variable is not directly used globally

    # ABSA Model (Aspect-Based Sentiment Analysis)
    ABSA_LABELS = ['Negative', 'Neutral', 'Positive']
    ABSA_ID2LABEL = {i: label for i, label in enumerate(ABSA_LABELS)} # Assign to global
    ABSA_LABEL2ID = {label: i for label, i in enumerate(ABSA_LABELS)}
    # NUM_ABSA_LABELS = len(ABSA_LABELS) # This variable is not directly used globally

    # Define absolute paths for models and dictionary - Ensure these paths are correct on your system
    # For more portable deployment, consider relative paths or environment variables.
    ate_model_path = r"C:\Users\unitf\OneDrive\Desktop\FYP\mrt_absa_webapp\backend\models\ate_model_v1.pkl"
    absa_model_path = r"C:\Users\unitf\OneDrive\Desktop\FYP\mrt_absa_webapp\backend\models\absa_model_v1.pkl"
    ASPECT_DICT_PATH = r"C:\Users\unitf\OneDrive\Desktop\FYP\Data\aspect_dictionary.csv"

    # Initialize model architecture
    ate_config = BertConfig.from_pretrained("bert-base-uncased")
    absa_config = BertConfig.from_pretrained("bert-base-uncased")

    ate_model_instance = bert_ATE(ate_config)
    absa_model_instance = bert_ABSA(absa_config)

    try:
        ate_model_instance.load_state_dict(torch.load(ate_model_path, map_location=device))
        ate_model = ate_model_instance # Assign to global variable
        ate_model.to(device)
        ate_model.eval()
        print(f"ATE model '{ate_model_path}' loaded successfully on {device}.")
    except FileNotFoundError:
        print(f"Error: ATE model file '{ate_model_path}' not found. Please ensure the path is correct.")
        ate_model = None
    except Exception as e:
        print(f"Error loading ATE model from '{ate_model_path}': {e}")
        ate_model = None

    try:
        absa_model_instance.load_state_dict(torch.load(absa_model_path, map_location=device))
        absa_model = absa_model_instance # Assign to global variable
        absa_model.to(device)
        absa_model.eval()
        print(f"ABSA model '{absa_model_path}' loaded successfully on {device}.")
    except FileNotFoundError:
        print(f"Error: ABSA model file '{absa_model_path}' not found. Please ensure the path is correct.")
        absa_model = None
    except Exception as e:
        print(f"Error loading ABSA model from '{absa_model_path}': {e}")
        absa_model = None

    # Load Aspect Dictionary
    try:
        if os.path.exists(ASPECT_DICT_PATH):
            aspect_dict_df = pd.read_csv(ASPECT_DICT_PATH)
            if 'term' in aspect_dict_df.columns and 'category' in aspect_dict_df.columns:
                for index, row in aspect_dict_df.iterrows():
                    term = str(row['term']).strip().lower()
                    category = str(row['category']).strip().lower()
                    if term and category:
                        if term not in aspect_dictionary:
                            aspect_dictionary[term] = []
                        if category not in aspect_dictionary[term]:
                            aspect_dictionary[term].append(category)
                print(f"Aspect dictionary '{ASPECT_DICT_PATH}' loaded successfully with {len(aspect_dictionary)} terms.")
            else:
                print(f"Warning: '{ASPECT_DICT_PATH}' must contain 'term' and 'category' columns. Category lookup will not work.")
        else:
            print(f"Warning: Aspect dictionary file '{ASPECT_DICT_PATH}' not found. Category lookup will not work.")
    except Exception as e:
        print(f"Error loading aspect dictionary: {e}. Category lookup will not work.")

# --- Text Preprocessing (Slightly less aggressive punctuation removal) ---
def preprocess_text(text):
    if not isinstance(text, str):
        print(f"DEBUG: preprocess_text received non-string: {type(text)}")
        return ""
    original_text = text
    text = text.lower()
    # Keep common punctuation that might impact sentiment: .,!?;'
    # Remove other special characters that are usually noise
    text = re.sub(r'[^a-z0-9\s.,!?;\'\u2019]', '', text) # \u2019 is unicode for right single quotation mark
    text = re.sub(r'\s+', ' ', text).strip() # Replace multiple spaces with single space
    print(f"DEBUG: Preprocessed '{original_text}' to '{text}'")
    return text

# --- Aspect Term Extraction (ATE) Function ---
def extract_aspect_terms_bert(review_text, max_len=128):
    print(f"DEBUG: ATE input review_text: '{review_text}'")
    if ate_model is None or ate_tokenizer is None or device is None or ATE_ID2LABEL is None: # Added ATE_ID2LABEL check
        print("ERROR: ATE model, tokenizer, device, or ATE_ID2LABEL not loaded for extraction.")
        return []

    preprocessed_text = preprocess_text(review_text)
    if not preprocessed_text:
        print("DEBUG: ATE: Preprocessed text is empty.")
        return []

    try:
        encoding = ate_tokenizer.encode_plus(
            preprocessed_text,
            add_special_tokens=True,
            max_length=max_len,
            padding='max_length',
            truncation=True,
            return_tensors='pt',
        )
        input_ids = encoding['input_ids'].to(device)
        attention_mask = encoding['attention_mask'].to(device)

        with torch.no_grad():
            outputs = ate_model(input_ids, attention_mask=attention_mask)
            logits = outputs['logits']
        
        predictions = torch.argmax(logits, dim=2).squeeze().cpu().numpy()
        
        extracted_aspects = []
        current_aspect_tokens = []
        original_tokens = ate_tokenizer.convert_ids_to_tokens(input_ids.squeeze().cpu().numpy())
        valid_length = (attention_mask.squeeze() == 1).sum().item()
        
        print(f"DEBUG: ATE original tokens: {original_tokens[:valid_length]}")
        print(f"DEBUG: ATE predictions (first valid tokens): {predictions[:valid_length]}")

        for i in range(1, valid_length - 1): # Exclude CLS and SEP tokens from direct processing for terms
            token = original_tokens[i]
            predicted_label_id = predictions[i]
            predicted_label = ATE_ID2LABEL.get(predicted_label_id, 'non-aspect') # Access global ATE_ID2LABEL
            
            if predicted_label == 'b-term':
                if current_aspect_tokens:
                    # Clean up the previous aspect term before adding the new one
                    extracted_aspects.append(ate_tokenizer.convert_tokens_to_string(current_aspect_tokens).replace(' ##', ''))
                current_aspect_tokens = [token]
            elif predicted_label == 'i-term':
                if current_aspect_tokens: # Only append if we are already building an aspect
                    current_aspect_tokens.append(token)
                # else: # If 'i-term' appears without a preceding 'b-term', treat as 'O' or ignore
                #     current_aspect_tokens = []
            else: # 'non-aspect' (O) label
                if current_aspect_tokens: # If we were building an aspect, finalize it
                    extracted_aspects.append(ate_tokenizer.convert_tokens_to_string(current_aspect_tokens).replace(' ##', ''))
                    current_aspect_tokens = [] # Reset for next aspect

        # Add the last aspect if the loop finishes with one in progress
        if current_aspect_tokens:
            extracted_aspects.append(ate_tokenizer.convert_tokens_to_string(current_aspect_tokens).replace(' ##', ''))
        
        # Deduplicate and clean up any empty strings
        final_extracted = list(set([aspect.strip() for aspect in extracted_aspects if aspect.strip()]))
        print(f"DEBUG: ATE Final extracted aspects: {final_extracted}")
        return final_extracted
    except Exception as e:
        print(f"ERROR: Exception during ATE model prediction: {e}")
        return []

# --- Aspect-Based Sentiment Analysis (ABSA) Function ---
def analyze_sentiment_for_term(review_text, aspect_term, max_len=128):
    print(f"DEBUG: ABSA input review: '{review_text}', aspect: '{aspect_term}'")
    if absa_model is None or absa_tokenizer is None or device is None or ABSA_ID2LABEL is None: # Added ABSA_ID2LABEL check
        print("ERROR: ABSA model, tokenizer, device, or ABSA_ID2LABEL not loaded for sentiment analysis.")
        return "N/A"

    preprocessed_review = preprocess_text(review_text)
    preprocessed_aspect = preprocess_text(aspect_term)

    if not preprocessed_review or not preprocessed_aspect:
        print("DEBUG: ABSA: Preprocessed review or aspect is empty. Cannot analyze sentiment.")
        return "N/A"

    try:
        # Crucial step: Encode review and aspect as two segments for aspect-level sentiment.
        # The BERT model's [CLS] token will then represent the sentiment of the review w.r.t the aspect.
        inputs = absa_tokenizer.encode_plus(
            preprocessed_review,
            preprocessed_aspect,
            add_special_tokens=True,
            max_length=max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt',
            return_token_type_ids=True # Necessary for distinguishing the two segments
        )

        input_ids = inputs['input_ids'].to(device)
        attention_mask = inputs['attention_mask'].to(device)
        token_type_ids = inputs['token_type_ids'].to(device) # Segment IDs

        with torch.no_grad():
            outputs = absa_model(input_ids=input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids)
            logits = outputs['logits']
        
        predicted_class_id = torch.argmax(logits, dim=1).item()
        sentiment = ABSA_ID2LABEL.get(predicted_class_id, "Unknown Sentiment") # Access global ABSA_ID2LABEL
        print(f"DEBUG: ABSA result for '{aspect_term}': {sentiment}")
        return sentiment
    except Exception as e:
        print(f"ERROR: Exception during ABSA model prediction: {e}")
        return "N/A"

# --- Function to get category from dictionary ---
def get_category_for_term(term):
    preprocessed_term = preprocess_text(term)
    # Check if the term exists in the dictionary and has categories
    categories = aspect_dictionary.get(preprocessed_term, [])
    category_result = categories[0] if categories else "other/uncategorized"
    print(f"DEBUG: Category for term '{term}' ({preprocessed_term}): {category_result}")
    return category_result

# --- Function to identify terms directly from the dictionary in the review text ---
def identify_dictionary_terms(review_text):
    print(f"DEBUG: Identifying dictionary terms in: '{review_text}'")
    found_terms_and_categories = []
    preprocessed_review = preprocess_text(review_text)
    
    # Sort terms by length in descending order to match longer phrases first
    sorted_dict_terms = sorted(aspect_dictionary.keys(), key=len, reverse=True)

    for term in sorted_dict_terms:
        # Use regex with word boundaries to ensure full term matching
        # re.escape handles special characters in the term
        if re.search(r'\b' + re.escape(term) + r'\b', preprocessed_review):
            # Only add if a specific category is found (not 'other/uncategorized' from get_category_for_term's default)
            category = get_category_for_term(term)
            if category != "other/uncategorized":
                found_terms_and_categories.append({'term': term, 'category': category})
    
    # Remove duplicates (if a shorter term is part of a longer one, but both are in dict)
    # Convert to dictionary and then back to list to keep unique terms based on the term string
    unique_terms = {item['term']: item for item in found_terms_and_categories}.values()
    final_dict_terms = list(unique_terms)
    print(f"DEBUG: Dictionary found terms: {final_dict_terms}")
    return final_dict_terms

# --- Main analysis function to be called from Flask ---
def perform_absa_analysis(user_review):
    print(f"\nDEBUG: --- Starting ABSA analysis for review: '{user_review}' ---")
    # Check if models/tokenizers/labels are loaded
    if ate_model is None or absa_model is None or ate_tokenizer is None or \
       absa_tokenizer is None or ATE_ID2LABEL is None or ABSA_ID2LABEL is None:
        print("ERROR: ABSA models, tokenizers, or ID2LABEL mappings not loaded. Cannot perform analysis.")
        raise RuntimeError("ABSA models or tokenizers failed to load at application startup.")

    if not user_review.strip():
        print("DEBUG: Review is empty, returning empty results.")
        return []

    processed_results = []
    processed_term_texts = set() # Keep track of terms already processed to avoid duplicates

    # NEW LOGIC: Split sentence based on contrastive conjunctions
    contrastive_conjunctions = ['but', 'however', 'although', 'yet', 'nevertheless', 'though', 'whereas', 'while']
    
    # Create a regex pattern to split by any of the conjunctions, keeping the conjunctions
    # The regex needs to handle word boundaries and case insensitivity
    pattern = r'(' + '|'.join(re.escape(conj) for conj in contrastive_conjunctions) + r')'
    segments = re.split(pattern, user_review, flags=re.IGNORECASE)
    
    # Filter out empty strings from split and strip whitespace
    segments = [s.strip() for s in segments if s.strip()]

    print(f"DEBUG: Sentence split into segments: {segments}")

    # Process each segment independently
    for i, segment in enumerate(segments):
        # We need to consider if the segment is a conjunction itself. If it is, skip it.
        if segment.lower() in contrastive_conjunctions:
            continue

        print(f"DEBUG: Processing segment {i+1}: '{segment}'")
        
        # Approach 1: Terms identified by BERT ATE model within this segment
        bert_extracted_terms = extract_aspect_terms_bert(segment)
        print(f"DEBUG: BERT ATE extracted terms for segment '{segment}': {bert_extracted_terms}")
        for term in bert_extracted_terms:
            preprocessed_term = preprocess_text(term)
            # Only add if this term hasn't been processed across *all* segments already
            if preprocessed_term not in processed_term_texts:
                category = get_category_for_term(term)
                # Perform aspect-specific sentiment analysis using the *original segment* as context
                sentiment = analyze_sentiment_for_term(segment, term)
                processed_results.append({
                    'term': term,
                    'category': category,
                    'polarity': sentiment
                })
                processed_term_texts.add(preprocessed_term)

        # Approach 2: Terms explicitly found from the dictionary within this segment
        dictionary_found_terms_info = identify_dictionary_terms(segment)
        print(f"DEBUG: Dictionary identified terms for segment '{segment}': {dictionary_found_terms_info}")
        for item in dictionary_found_terms_info:
            term = item['term']
            category = item['category']
            preprocessed_term = preprocess_text(term)
            
            if preprocessed_term not in processed_term_texts: # Ensure not to re-process terms already found
                # Perform aspect-specific sentiment analysis using the *original segment* as context
                sentiment = analyze_sentiment_for_term(segment, term)
                processed_results.append({
                    'term': term,
                    'category': category,
                    'polarity': sentiment
                })
                processed_term_texts.add(preprocessed_term)
    
    # Handle cases where no specific aspects are found (even after splitting) but there's a review
    # In this case, we might analyze the overall sentiment of the original review
    if not processed_results and user_review.strip():
        print("DEBUG: No specific aspects found after splitting, analyzing general review sentiment from original review.")
        # For general sentiment, you can choose to analyze the review against itself as an "aspect"
        # or use a separate general sentiment model if available.
        general_sentiment = analyze_sentiment_for_term(user_review, user_review) 
        if general_sentiment != "N/A":
            processed_results.append({
                'term': 'general_review',
                'category': 'other/uncategorized',
                'polarity': general_sentiment
            })
    
    # Sort results for consistent output
    processed_results.sort(key=lambda x: (x['category'], x['term']))
    print(f"DEBUG: --- ABSA analysis finished. Final results: {processed_results} ---")
    return processed_results

# Call the model loading function once when the module is imported
print("Attempting to load ABSA models on startup...")
try:
    _load_absa_models_once()
except Exception as e:
    print(f"Initial model loading failed: {e}. Flask app might not function as expected.")