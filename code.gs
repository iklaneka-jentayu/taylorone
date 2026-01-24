// Google Apps Script for CRUD operations with Google Sheets
// Spreadsheet Name: "Elite_Tailor_Orders_Management"

// Initialize the spreadsheet with headers
function initializeSheet() {
  const spreadsheetName = "Elite_Tailor_Orders_Management";
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check if spreadsheet exists, if not create it
  try {
    spreadsheet = SpreadsheetApp.openById(spreadsheet.getId());
  } catch (e) {
    spreadsheet = SpreadsheetApp.create(spreadsheetName);
  }
  
  let sheet = spreadsheet.getSheetByName("Orders");
  
  // Create Orders sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet("Orders");
    
    // Set up headers
    const headers = [
      "Order ID",
      "Timestamp",
      "Customer Name",
      "Email",
      "Phone",
      "Service Type",
      "Fabric Type",
      "Color",
      "Measurements",
      "Special Instructions",
      "Delivery Date",
      "Urgency",
      "Budget",
      "Status",
      "Last Updated"
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.getRange(1, 1, 1, headers.length).setBackground("#f0f0f0");
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Set column widths
    sheet.setColumnWidth(1, 150); // Order ID
    sheet.setColumnWidth(2, 180); // Timestamp
    sheet.setColumnWidth(3, 200); // Customer Name
    sheet.setColumnWidth(4, 250); // Email
    sheet.setColumnWidth(5, 150); // Phone
    sheet.setColumnWidth(6, 150); // Service Type
    sheet.setColumnWidth(7, 150); // Fabric Type
    sheet.setColumnWidth(8, 100); // Color
    sheet.setColumnWidth(9, 300); // Measurements
    sheet.setColumnWidth(10, 300); // Special Instructions
    sheet.setColumnWidth(11, 150); // Delivery Date
    sheet.setColumnWidth(12, 100); // Urgency
    sheet.setColumnWidth(13, 150); // Budget
    sheet.setColumnWidth(14, 150); // Status
    sheet.setColumnWidth(15, 180); // Last Updated
    
    // Create a log
    Logger.log("Sheet initialized successfully");
  }
  
  // Return spreadsheet URL for reference
  return {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    sheetName: "Orders"
  };
}

// Handle POST requests (Create, Update, Delete)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let response;
    
    switch (action) {
      case 'create':
        response = createOrder(data);
        break;
      case 'update':
        response = updateOrder(data);
        break;
      case 'delete':
        response = deleteOrder(data);
        break;
      default:
        response = {
          success: false,
          message: "Invalid action"
        };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (Read operations)
function doGet(e) {
  const action = e.parameter.action;
  const type = e.parameter.type;
  
  try {
    let response;
    
    if (action === 'read' && type === 'orders') {
      response = readOrders();
    } else {
      response = {
        success: false,
        message: "Invalid request parameters"
      };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Create a new order
function createOrder(orderData) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Orders");
  
  if (!sheet) {
    initializeSheet();
    return createOrder(orderData); // Retry after initialization
  }
  
  // Get the last row
  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;
  
  // Prepare data for insertion
  const rowData = [
    orderData.orderId,
    orderData.timestamp,
    orderData.customerName,
    orderData.email,
    orderData.phone,
    orderData.serviceType,
    orderData.fabricType,
    orderData.color,
    orderData.measurements,
    orderData.specialInstructions,
    orderData.deliveryDate,
    orderData.urgency,
    orderData.budget,
    orderData.status || "pending",
    new Date().toISOString()
  ];
  
  // Insert data
  sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
  
  // Apply formatting
  const range = sheet.getRange(newRow, 1, 1, rowData.length);
  range.setBorder(false, false, true, false, false, false, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);
  
  // Auto-resize columns for measurements and instructions
  sheet.autoResizeColumn(9);
  sheet.autoResizeColumn(10);
  
  return {
    success: true,
    message: "Order created successfully",
    orderId: orderData.orderId,
    row: newRow
  };
}

// Read all orders
function readOrders() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Orders");
  
  if (!sheet) {
    initializeSheet();
    return { data: [] };
  }
  
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  
  if (lastRow <= 1) {
    return { data: [] };
  }
  
  // Get all data except header
  const dataRange = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  const data = dataRange.getValues();
  
  // Convert to array of objects
  const orders = data.map(row => ({
    orderId: row[0],
    timestamp: row[1],
    customerName: row[2],
    email: row[3],
    phone: row[4],
    serviceType: row[5],
    fabricType: row[6],
    color: row[7],
    measurements: row[8],
    specialInstructions: row[9],
    deliveryDate: row[10],
    urgency: row[11],
    budget: row[12],
    status: row[13],
    lastUpdated: row[14]
  }));
  
  return {
    success: true,
    data: orders
  };
}

// Update an existing order
function updateOrder(updateData) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Orders");
  
  if (!sheet) {
    return {
      success: false,
      message: "Sheet not found"
    };
  }
  
  const lastRow = sheet.getLastRow();
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 15);
  const data = dataRange.getValues();
  
  let foundRow = -1;
  
  // Find the order by ID
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === updateData.orderId) {
      foundRow = i + 2; // +2 because header is row 1 and arrays are 0-indexed
      break;
    }
  }
  
  if (foundRow === -1) {
    return {
      success: false,
      message: "Order not found"
    };
  }
  
  // Get existing data
  const existingRow = sheet.getRange(foundRow, 1, 1, 15).getValues()[0];
  
  // Update only the specified fields
  if (updateData.status) {
    sheet.getRange(foundRow, 14).setValue(updateData.status); // Status column
  }
  
  if (updateData.specialInstructions) {
    sheet.getRange(foundRow, 10).setValue(updateData.specialInstructions); // Special Instructions column
  }
  
  if (updateData.deliveryDate) {
    sheet.getRange(foundRow, 11).setValue(updateData.deliveryDate); // Delivery Date column
  }
  
  // Update last updated timestamp
  sheet.getRange(foundRow, 15).setValue(new Date().toISOString()); // Last Updated column
  
  return {
    success: true,
    message: "Order updated successfully",
    orderId: updateData.orderId
  };
}

// Delete an order
function deleteOrder(deleteData) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Orders");
  
  if (!sheet) {
    return {
      success: false,
      message: "Sheet not found"
    };
  }
  
  const lastRow = sheet.getLastRow();
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 15);
  const data = dataRange.getValues();
  
  let foundRow = -1;
  
  // Find the order by ID
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === deleteData.orderId) {
      foundRow = i + 2; // +2 because header is row 1 and arrays are 0-indexed
      break;
    }
  }
  
  if (foundRow === -1) {
    return {
      success: false,
      message: "Order not found"
    };
  }
  
  // Delete the row
  sheet.deleteRow(foundRow);
  
  return {
    success: true,
    message: "Order deleted successfully",
    orderId: deleteData.orderId
  };
}

// Helper function to test the script
function testFunctions() {
  Logger.log("Testing initialization...");
  const initResult = initializeSheet();
  Logger.log("Initialization result: " + JSON.stringify(initResult));
  
  Logger.log("Testing order creation...");
  const testOrder = {
    orderId: "TEST-" + Date.now(),
    timestamp: new Date().toISOString(),
    customerName: "Test Customer",
    email: "test@example.com",
    phone: "1234567890",
    serviceType: "custom_suit",
    fabricType: "Wool",
    color: "Navy Blue",
    measurements: "Test measurements",
    specialInstructions: "Test instructions",
    deliveryDate: "2024-12-31",
    urgency: "standard",
    budget: "1000-2000",
    status: "pending"
  };
  
  const createResult = createOrder(testOrder);
  Logger.log("Create result: " + JSON.stringify(createResult));
  
  Logger.log("Testing order reading...");
  const readResult = readOrders();
  Logger.log("Read " + readResult.data.length + " orders");
  
  if (readResult.data.length > 0) {
    const lastOrder = readResult.data[readResult.data.length - 1];
    
    Logger.log("Testing order update...");
    const updateResult = updateOrder({
      orderId: lastOrder.orderId,
      status: "in_progress",
      specialInstructions: "Updated instructions"
    });
    Logger.log("Update result: " + JSON.stringify(updateResult));
    
    Logger.log("Testing order deletion...");
    const deleteResult = deleteOrder({
      orderId: lastOrder.orderId
    });
    Logger.log("Delete result: " + JSON.stringify(deleteResult));
  }
  
  Logger.log("All tests completed!");
}