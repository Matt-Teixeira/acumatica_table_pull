# Acumatica Systems Table

## Purpose

Due to the lack of trust in data received from Acumatica, we use this app to maintain a table that reflects systems in the Acumatica API without risk of detrimental modification to the systems table.

## Tables Affected

The acumatica_systems table is utilized as an intermediate table set for modification by incoming API data.

## Steps and Actions

1. Receive system data: Acumatica API call
2. Process incoming system data
    * Determine which systems are in Acumatica, but not in the database
        * Append to add list
    * Determine which systems are in the database, but not in Acumatica
        * Append to remove list
    * Determine "deep" delta & log differences in values for properties associated with each system

        ### EXAMPLE OF DELTA
        ```javascript
        {
        "system":"SME00442",
        "deltas":{
            "api":{
                "customeruniqueid":"54193600"
            },
            "db":{
                "customeruniqueid":null
            }
        }
        ```


3. Insert new systems into acumatica_systems table
4. Update acumatica_systems table according to deltas
5. Queries ran against acumatica_systems, as well as their values, are logged.