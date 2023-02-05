("use strict");
require("dotenv").config();
const { log } = require("../logger");

async function format_api_data(equipmentData) {
  try {
    await log("info", "NA", "NA", "format_api_data", `FN CALL`);
    const formatted_data = [];

    for await (let system of equipmentData) {
      let data = {
        equipmentnbr: system.EquipmentNbr.value,
        customercontractcustomerid: system.CustomerContractCustomerID.value,
        customeruniqueid: system.CustomerUniqueID.value, 
        customercontractcustomername: system.CustomerContractCustomerName.value,
        servicecontractcustomerid: system.ServiceContractCustomerID.value,
        servicecontractcustomername: system.ServiceContractCustomerName.value,
        state: system.State.value,
        city: system.City.value,
        addressline1: system.AddressLine1.value,
        postalcode: system.PostalCode.value,
        manufacturer: system.Manufacturer.value,
        modality: system.Modality.value,
        model: system.Model.value,
        serialnbr: system.SerialNbr.value,
        room: system.Room.value,
      };
      formatted_data.push(data);
      data = {}
    }
    return formatted_data;
  } catch (error) {
    await log("error", "NA", "NA", "format_api_data", `FN CALL`, {
      error: error.message,
    });
  }
}

module.exports = format_api_data;

/* EXAMPLE DATA
{
    "id": "0412e923-d5e6-e911-8176-efcdc93cb3d1",
    "rowNumber": 1,
    "note": "",
    "AddressLine1": {
        "value": "1 Hospital Dr"
    },
    "AddressLine2": {},
    "City": {
        "value": "Lewisburg"
    },
    "CustomerContractCustomerID": {
        "value": "C0151"
    },
    "CustomerContractCustomerName": {
        "value": "Renovo Solutions, LLC"
    },
    "CustomerContractID": {
        "value": "80625 (EH)"
    },
    "CustomerContractLocationID": {
        "value": "MAIN"
    },
    "CustomerContractLocationName": {
        "value": "Ship To Main Location"
    },
    "CustomerContractStatus": {
        "value": "Active"
    },
    "CustomerID": {
        "value": "C000008"
    },
    "CustomerName": {
        "value": "Evangelical Community Hospital"
    },
    "CustomerUniqueID": {},
    "EquipmentDescription": {
        "value": "Renovo - Evangelical Hospital - Cath Lab 1"
    },
    "EquipmentNbr": {
        "value": "SME00338"
    },
    "IPAddress": {},
    "LastPMCompleted": {},
    "LegacyEquipmentID": {},
    "LocationID": {
        "value": "MAIN"
    },
    "LocationName": {
        "value": "Primary Location"
    },
    "Manufacturer": {
        "value": "GE Healthcare"
    },
    "Modality": {
        "value": "CV/IR"
    },
    "Model": {
        "value": "INNOVA 3100"
    },
    "ModelDescription": {
        "value": "Innova 3100"
    },
    "PMFrequencyinmonths": {},
    "PostalCode": {
        "value": "17837"
    },
    "Room": {},
    "SerialNbr": {
        "value": "611419BU3"
    },
    "ServiceContractCustomerID": {
        "value": "C000008"
    },
    "ServiceContractCustomerName": {
        "value": "Evangelical Community Hospital"
    },
    "ServiceContractID": {
        "value": "FCT00000502"
    },
    "ServiceContractLocationID": {
        "value": "MAIN"
    },
    "ServiceContractLocationName": {
        "value": "Primary Location"
    },
    "ServiceContractStatus": {
        "value": "Active"
    },
    "ShowonRemoteServicesWebsite": {
        "value": false
    },
    "SoftwareRelease": {},
    "State": {
        "value": "PA"
    },
    "Status": {
        "value": "Active"
    },
    "custom": {},
    "files": []
}
*/