// frontend/src/components/VerticalStationSelector.jsx
import React from "react";

const VerticalStationSelector = ({ stations, selectedStationId, onSelectStation }) => {
  // Create a new array including the "Total Stations" option
  const stationsWithOptions = [
    { station_id: 'all_stations', station_name: 'Total Stations' }, // Our new special option
    ...stations
  ];

  return (
    <div className="flex flex-col items-start space-y-6">
      {stationsWithOptions.map((station) => {
        const isTotalStations = station.station_id === 'all_stations';

        // Determine the base color classes based on whether it's 'Total Stations' or an individual station
        const baseColorClasses = isTotalStations
          ? `bg-purple-300 hover:bg-purple-500` // Light mode: default purple, hover slightly darker
          : `bg-blue-300 hover:bg-blue-500`;   // Light mode: default blue, hover slightly darker

        // Determine the selected color classes
        const selectedColorClasses = isTotalStations
          ? `bg-purple-600 ring-2 ring-offset-2 ring-purple-400 dark:bg-purple-700 dark:ring-purple-500` // Dark mode: darker purple, matching ring
          : `bg-blue-600 ring-2 ring-offset-2 ring-blue-400 dark:bg-blue-700 dark:ring-blue-500`;   // Dark mode: darker blue, matching ring

        return (
          <div
            key={station.station_id}
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onSelectStation(station.station_id)}
          >
            <div
              className={`w-4 h-4 rounded-full transition duration-300
                ${selectedStationId === station.station_id
                  ? selectedColorClasses
                  : baseColorClasses
                }
              `}
            ></div>
            <span className="text-xs text-gray-700 dark:text-gray-200 group-hover:font-semibold whitespace-nowrap">
              {station.station_name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default VerticalStationSelector;