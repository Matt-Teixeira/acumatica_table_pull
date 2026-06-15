async function format_api_data(equipmentData) {
  const formatted_data = [];

  for (const system of equipmentData) {
    const data = Object.fromEntries(
      Object.entries({
        equipmentnbr: system.Description,
        customercontractcustomerid: system.CustomerContractCustomerID,
        customeruniqueid: system.CustomerUniqueID,
        customercontractcustomername: system.CustomerContractCustomerName,
        servicecontractcustomerid: system.ServiceContractCustomerID,
        servicecontractcustomername: system.ServiceContractCustomerName,
        state: system.State,
        city: system.City,
        addressline1: system.AddressLine1,
        postalcode: system.PostalCode,
        manufacturer: system.Manufacturer,
        modality: system.Modality,
        model: system.Model,
        serialnbr: system.SerialNbr,
        room: system.Room
      }).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value
      ])
    );
    formatted_data.push(data);
  }

  return formatted_data;
}

module.exports = format_api_data;
