function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return jsonResponse({ status: "ok" });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No se recibieron datos en el body.");
    }

    var data = JSON.parse(e.postData.contents);
    var groupName = String(data.groupName || "").trim();
    var attendance = data.attendance;
    var guestCount = Number(data.guestCount || 0);
    var guestNames = Array.isArray(data.guestNames) ? data.guestNames : [];

    if (!groupName) {
      throw new Error("groupName es obligatorio.");
    }

    if (attendance !== "si" && attendance !== "no") {
      throw new Error("attendance debe ser 'si' o 'no'.");
    }

    if (attendance === "si") {
      if (guestCount < 1) {
        throw new Error("guestCount debe ser mayor o igual a 1.");
      }

      if (guestNames.length !== guestCount || guestNames.some(function(name) {
        return !String(name || "").trim();
      })) {
        throw new Error("Todos los guestNames son obligatorios.");
      }
    } else {
      guestCount = 0;
      guestNames = [];
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date(),
      groupName,
      attendance,
      guestCount,
      guestNames.join(", ")
    ]);

    return jsonResponse({ status: "ok" });
  } catch (error) {
    return jsonResponse({
      status: "error",
      message: error.message
    });
  }
}
