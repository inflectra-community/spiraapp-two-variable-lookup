# spiraapp-two-variable-lookup

A SpiraApp that implements a two-variable lookup table mechanism for Inflectra SpiraPlan/SpiraTeam/SpiraTest.

## Overview
Computer Software Assurance (CSA) follows a tailed approach that does not use standard risk probability and impact. It uses semi-quantitative custom-defined qualitative categorization with a quantitative impact score.
Unlike standard risk management where exposure is a product of the scale associated with probability (likelihood) and impact (severity), the exposure is a custom-defined look-up value for each combination (category, impact).
It also optionally associates a meaning with the look-up value that indicates the type of risk treatment needed for prioritizing requirements.

The Two-Variable Lookup Table SpiraApp enables users to define lookup tables that map combinations of two custom list values to output values. When users select values from two dropdown lists (List A and List B) and save the artifact, the app automatically populates the output fields with the corresponding values from a JSON matrix.

## Features

- **Two-Variable Lookup**: Map combinations of values from two custom lists to output values
- **Automatic Population**: Lookup values are populated automatically when saving
- **Single Save Workflow**: User only needs to save once
- **Validation**: Validates configuration and matrix completeness on page load
- **Rich Error Messages**: All messages prefixed with app name for easy identification
- **Integer and Text Support**: The required output lookup value is an integer but the optional definition is a text; both come from the JSON definition.

## Version

**Current Version: 1.1** - Uses API approach for reliable single-save workflow.

## Installation

1. Build the SpiraApp from the source files
2. Install in Spira via SpiraApps management
3. Configure product settings with custom property IDs and JSON matrix

## Configuration

### 1. Create Custom Properties (on Requirements artifact)

Create these custom properties in Spira Admin:

| Field | Type | Example Values |
|-------|------|----------------|
| List A (Row) | Custom List | 1 - Standard, 2 - Custom, 3 - Consulting |
| List B (Column) | Custom List | 1 - Low, 2 - Medium, 3 - High, 4 - Critical |
| Output Value | Integer | (will be auto-populated) |
| Output Definition | Text (optional) | (will be auto-populated) |

### 2. Configure Product Settings

In Spira Admin > SpiraApps > Two-Variable Lookup Tables (V2) > Product Settings:

```
listAProperty: <Custom Property ID for List A>
listBProperty: <Custom Property ID for List B>
outputValueProperty: <Custom Property ID for Output Value (Integer)>
outputDefinitionProperty: <Custom Property ID for Output Definition (Text) - optional>
matrixData: <JSON matrix>
```

### 3. JSON Matrix Format (Row-List A|Column List B lookup for values and definition)

```json
{
  "1|1": {"value": "1", "definition": "Relies on basic audit"},
  "1|2": {"value": "1", "definition": "Relies on internal non-team member testing"},
  "1|3": {"value": "2", "definition": "Requirement validation followed by BU testing"},
  "1|4": {"value": "3", "definition": "Requirement validation, test approval, and BU testing"},
  "2|1": {"value": "1", "definition": "Relies on basic audit"},
  "2|2": {"value": "2", "definition": "Requirement validation followed by BU testing"},
  "2|3": {"value": "3", "definition": "Requirement validation, test approval, and BU testing"},
  "2|4": {"value": "4", "definition": "Requirement validated, test approval, BU and exploratory testing"},
  "3|1": {"value": "1", "definition": "Relies on basic audit"},
  "3|2": {"value": "3", "definition": "Requirement validation, test approval, and BU testing"},
  "3|3": {"value": "4", "definition": "Requirement validated, test approval, BU and exploratory testing"},
  "3|4": {"value": "5", "definition": "Requirement validated, test approval, Internal and external BU and exploratory testing"}
}
```

**Key Format:** `rowKey|colKey` where rowKey and colKey are the numbers at the start of the custom list items (e.g., "3 - Consulting" → key 3).

### 4. Example of the Product Setting
[Here is an example of the SpiraApp Product Configuration]<img width="483" height="302" alt="LookupTableProductSetting" src="https://github.com/user-attachments/assets/d1a5490f-3f9e-43dc-aadc-322fb513ada3" />

## Usage

1. Open a Requirement in Spira
2. Select a value from List A dropdown
3. Select a value from List B dropdown
4. Click Save
5. The app will:
   - Fetch the requirement data
   - Get the selected list item names
   - Extract the numbers from the names
   - Look up the combination in the JSON matrix
   - Update the requirement with the lookup values
6. Page reloads with output fields populated

## Validation

The app validates on page load:

1. **Required Fields**: Checks all required settings are configured
2. **JSON Syntax**: Validates the matrix JSON is valid
3. **Matrix Completeness**: Checks all List A × List B combinations exist in JSON

Error messages are prefixed with "TwoVariableLookupTable:" for easy identification.

## Technical Details

- **Works on:** Requirement Details page (page 9)
- **API Version:** 7.0
- **Approach:** Uses API to fetch and update requirement (like FMEA app)
- **Save Flow:** registerEvent_dataSaved → fetch requirement → fetch custom lists → lookup → update → reload
- **Output Fields:** Integer uses IntegerValue, Text uses StringValue

## Files

- **manifest.yaml** - SpiraApp configuration
- **lookupTableV2.js** - Main runtime script (V2)
- **README.md** - Quick reference guide

## License

MIT License - see LICENSE file for details

## Support

For support, please visit: https://www.inflectra.com/support

## Author

Inflectra Corporation
