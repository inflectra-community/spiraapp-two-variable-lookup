/**
 * Two-Variable Lookup Table SpiraApp v1.1
 * - Uses Integer/Text fields for output
 * - Uses API to update values after save
 */

let localState = {};
let validationRunOnLoad = false;
const appName = "TwoVariableLookupTable";
const appErrorPrefix = appName + ": ";

// Register event handler on page load for validation
spiraAppManager.registerEvent_loaded(lookupTable_loaded);

// Register event handler on page save event
spiraAppManager.registerEvent_dataSaved(lookupTable_dataSaved);

// This function runs on page load - for validation
function lookupTable_loaded() {
    
    // Run validation only once
    if (validationRunOnLoad) {
        return;
    }
    validationRunOnLoad = true;
    
    // Run validation
    runValidationOnLoad();
}

// This function runs AFTER the artifact is saved
function lookupTable_dataSaved(operation, newId) {
    
    var projectId = spiraAppManager.projectId;
    var requirementId = spiraAppManager.artifactId;

    // Make sure settings are configured
    if (projectId && requirementId && SpiraAppSettings[APP_GUID] && 
        SpiraAppSettings[APP_GUID].listAProperty && 
        SpiraAppSettings[APP_GUID].listBProperty && 
        SpiraAppSettings[APP_GUID].outputValueProperty &&
        SpiraAppSettings[APP_GUID].matrixData) {
        
        // First get the current requirement via the Spira API
        var url = 'projects/' + projectId + '/requirements/' + requirementId;
        spiraAppManager.executeApi('TwoVariableLookupTable', '7.0', 'GET', url, null, 
            lookupTable_getRequirement_success, 
            lookupTable_operation_failure);
    }
}

function lookupTable_getRequirement_success(requirement) {
    
    var customProperties = requirement.CustomProperties;
    var listAPropertyId = SpiraAppSettings[APP_GUID].listAProperty;
    var listBPropertyId = SpiraAppSettings[APP_GUID].listBProperty;
    var outputValuePropertyId = SpiraAppSettings[APP_GUID].outputValueProperty;
    var outputDefinitionPropertyId = SpiraAppSettings[APP_GUID].outputDefinitionProperty;
    var matrixDataJson = SpiraAppSettings[APP_GUID].matrixData;
    
    var customProperty_listA = null;
    var customProperty_listB = null;
    var customProperty_outputValue = null;
    var customProperty_outputDefinition = null;
    
    if (customProperties && customProperties.length > 0) {
        for (var i = 0; i < customProperties.length; i++) {
            var prop = customProperties[i];
            if (prop.PropertyNumber == listAPropertyId) {
                customProperty_listA = prop;
            }
            if (prop.PropertyNumber == listBPropertyId) {
                customProperty_listB = prop;
            }
            if (prop.PropertyNumber == outputValuePropertyId) {
                customProperty_outputValue = prop;
            }
            if (outputDefinitionPropertyId && prop.PropertyNumber == outputDefinitionPropertyId) {
                customProperty_outputDefinition = prop;
            }
        }
    }
    
    // Get the IntegerValue (list item ID) from List A and List B
    var listAItemId = customProperty_listA ? customProperty_listA.IntegerValue : null;
    var listBItemId = customProperty_listB ? customProperty_listB.IntegerValue : null;
    
    if (!listAItemId || !listBItemId) {
        return;
    }
    
    // Get the custom list IDs from the property definitions
    var listADefinition = customProperty_listA.Definition;
    var listBDefinition = customProperty_listB.Definition;
    
    if (listADefinition && listADefinition.CustomList && listBDefinition && listBDefinition.CustomList) {
        var listACustomListId = listADefinition.CustomList.CustomPropertyListId;
        var listBCustomListId = listBDefinition.CustomList.CustomPropertyListId;
        
        // Store state for callbacks
        localState.customProperty_listA = customProperty_listA;
        localState.customProperty_listB = customProperty_listB;
        localState.customProperty_outputValue = customProperty_outputValue;
        localState.customProperty_outputDefinition = customProperty_outputDefinition;
        localState.matrixDataJson = matrixDataJson;
        localState.listAItemId = listAItemId;
        localState.listBItemId = listBItemId;
        localState.outputValuePropertyId = outputValuePropertyId;
        localState.outputDefinitionPropertyId = outputDefinitionPropertyId;
        
        // Fetch List A custom list to get the item name
        var urlA = 'project-templates/' + spiraAppManager.projectTemplateId + '/custom-lists/' + listACustomListId;
        spiraAppManager.executeApi('TwoVariableLookupTable', '7.0', 'GET', urlA, null, 
            lookupTable_getListA_success, 
            lookupTable_operation_failure);
    } else {
    }
}

function lookupTable_getListA_success(customList) {
    
    // Find the selected item name
    var listAKey = null;
    if (customList && customList.Values) {
        for (var i = 0; i < customList.Values.length; i++) {
            if (customList.Values[i].CustomPropertyValueId == localState.listAItemId) {
                var itemName = customList.Values[i].Name;
                listAKey = extractKey(itemName);
                break;
            }
        }
    }
    
    if (listAKey === null) {
        return;
    }
    
    // Now fetch List B custom list
    var listBDefinition = localState.customProperty_listB ? localState.customProperty_listB.Definition : null;
    if (listBDefinition && listBDefinition.CustomList) {
        var listBCustomListId = listBDefinition.CustomList.CustomPropertyListId;
        var urlB = 'project-templates/' + spiraAppManager.projectTemplateId + '/custom-lists/' + listBCustomListId;
        localState.listAKey = listAKey;
        spiraAppManager.executeApi('TwoVariableLookupTable', '7.0', 'GET', urlB, null, 
            lookupTable_getListB_success, 
            lookupTable_operation_failure);
    }
}

function lookupTable_getListB_success(customList) {
    
    // Find the selected item name
    var listBKey = null;
    if (customList && customList.Values) {
        for (var i = 0; i < customList.Values.length; i++) {
            if (customList.Values[i].CustomPropertyValueId == localState.listBItemId) {
                var itemName = customList.Values[i].Name;
                listBKey = extractKey(itemName);
                break;
            }
        }
    }
    
    if (listBKey === null) {
        return;
    }
    
    var listAKey = localState.listAKey;
    var key = listAKey + '|' + listBKey;
    
    // Parse the matrix
    var lookupMatrix;
    try {
        lookupMatrix = JSON.parse(localState.matrixDataJson);
    } catch (error) {
        spiraAppManager.displayErrorMessage(appErrorPrefix + "Invalid JSON data.");
        return;
    }
    
    var result = lookupMatrix[key];
    
    if (!result) {
        spiraAppManager.displayWarningMessage(appErrorPrefix + "No lookup found for " + key + ". Check matrix configuration.");
        return;
    }
    
    // Store for success message
    localState.lastValue = result.value;
    localState.lastDefinition = result.definition;
    
    // Fetch the requirement again to update it
    var projectId = spiraAppManager.projectId;
    var requirementId = spiraAppManager.artifactId;
    var url = 'projects/' + projectId + '/requirements/' + requirementId;
    
    spiraAppManager.executeApi('TwoVariableLookupTable', '7.0', 'GET', url, null, 
        lookupTable_getRequirementForUpdate_success, 
        lookupTable_operation_failure);
}

function lookupTable_getRequirementForUpdate_success(requirement) {
    // Update the custom properties in the fetched requirement
    var customProperties = requirement.CustomProperties;
    
    if (customProperties && customProperties.length > 0) {
        for (var i = 0; i < customProperties.length; i++) {
            var prop = customProperties[i];
            if (prop.PropertyNumber == localState.outputValuePropertyId && localState.lastValue) {
                prop.IntegerValue = localState.lastValue;
            }
            if (localState.outputDefinitionPropertyId && prop.PropertyNumber == localState.outputDefinitionPropertyId && localState.lastDefinition) {
                prop.StringValue = localState.lastDefinition;
            }
        }
    }
    
    // Save the updated requirement - URL without ID, body contains the full requirement with ID
    var projectId = spiraAppManager.projectId;
    var url = 'projects/' + projectId + '/requirements';
    var body = JSON.stringify(requirement);
    
    spiraAppManager.executeApi('TwoVariableLookupTable', '7.0', 'PUT', url, body, 
        lookupTable_update_success, 
        lookupTable_operation_failure);
}

function lookupTable_update_success() {
    console.log('[LookupTableV2] Successfully updated requirement');
    spiraAppManager.displaySuccessMessage(appErrorPrefix + "Lookup values populated: " + 
        (localState.lastValue || '') + 
        (localState.lastDefinition ? ' - ' + localState.lastDefinition : ''));
    // Reload form to show updated values
    spiraAppManager.reloadForm();
}

function lookupTable_operation_failure(status, error) {
    spiraAppManager.displayErrorMessage(appErrorPrefix + error);
}

function extractKey(value) {
    if (!value) return null;
    var match = String(value).match(/^(\d+)/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Validates the SpiraApp configuration on page load
 */
function runValidationOnLoad() {
    var settings = SpiraAppSettings[APP_GUID];
    
    if (!settings) {
        spiraAppManager.displayErrorMessage(appErrorPrefix + "Settings not found. Please configure the SpiraApp.");
        return;
    }
    
    // Check required fields are configured
    if (!settings.listAProperty || !settings.listBProperty || !settings.outputValueProperty || !settings.matrixData) {
        spiraAppManager.displayErrorMessage(appErrorPrefix + "One or more of the required fields are not setup. Please configure the SpiraApp");
        return;
    }
    
    // Check JSON syntax
    var lookupMatrix;
    try {
        lookupMatrix = JSON.parse(settings.matrixData);
    } catch (error) {
        spiraAppManager.displayErrorMessage(appErrorPrefix + "Invalid JSON data. Please contact your product administrator.");
        return;
    }
    
    // Get field names
    var listAFieldName = spiraAppManager.formatCustomFieldName(settings.listAProperty);
    var listBFieldName = spiraAppManager.formatCustomFieldName(settings.listBProperty);
    
    // Get dropdown items directly from the form (no API calls needed)
    var listAItems = spiraAppManager.getDropdownItems(listAFieldName);
    var listBItems = spiraAppManager.getDropdownItems(listBFieldName);
    
    if (!listAItems || !listBItems) {
        return;
    }
    
    // Extract keys from List A and List B options
    var listAKeys = new Set();
    var listBKeys = new Set();
    
    listAItems.forEach(function(item) {
        var key = extractKey(item.text);
        if (key !== null) listAKeys.add(key);
    });
    
    listBItems.forEach(function(item) {
        var key = extractKey(item.text);
        if (key !== null) listBKeys.add(key);
    });
    
    // Check that ALL combinations from List A × List B exist in JSON
    var missingCombinations = [];
    
    listAKeys.forEach(function(rowKey) {
        listBKeys.forEach(function(colKey) {
            var key = rowKey + '|' + colKey;
            if (!lookupMatrix.hasOwnProperty(key)) {
                missingCombinations.push(key);
            }
        });
    });
    
    if (missingCombinations.length > 0) {
        var errorMessage = appErrorPrefix + "Matrix is missing entries for: " + missingCombinations.join(', ');
        spiraAppManager.displayErrorMessage(errorMessage);
    } else {
    }
}