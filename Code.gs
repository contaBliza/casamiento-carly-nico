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
    if (!e || !e.parameter) {
      throw new Error("No se recibieron parametros en la solicitud.");
    }

    var groupName = String(e.parameter.groupName || "").trim();
    var attendance = String(e.parameter.attendance || "").trim();
    var guestCount = Number(e.parameter.guestCount || 0);
    var guestNames = String(e.parameter.guestNames || "").trim();

    Logger.log("RSVP recibido: %s", JSON.stringify({
      groupName: groupName,
      attendance: attendance,
      guestCount: guestCount,
      guestNames: guestNames
    }));

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

      if (!guestNames) {
        throw new Error("Todos los guestNames son obligatorios.");
      }
    } else {
      guestCount = 0;
      guestNames = "";
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date(),
      groupName,
      attendance,
      guestCount,
      guestNames
    ]);

    return jsonResponse({
      status: "ok",
      message: "RSVP guardado correctamente."
    });
  } catch (error) {
    Logger.log("Error en doPost: %s", error && error.stack ? error.stack : error);
    return jsonResponse({
      status: "error",
      message: error.message
    });
  }
}
