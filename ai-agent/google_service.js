const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

// We will load credentials from a JSON file that you download from Google Cloud
const KEYFILEPATH = path.join(__dirname, 'google_credentials.json');

// Scopes required for Calendar and Sheets
const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/spreadsheets'
];

let auth;
try {
    auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
    });
} catch (e) {
    console.error("Warning: google_credentials.json not found or invalid. Google services won't work.");
}

const calendar = google.calendar({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

// Environment variables for IDs (Need to add these to .env)
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

/**
 * Appends a new lead to the Google Sheet.
 * Expected columns: Timestamp | Name | Place | Help Needed | Phone Number
 */
async function appendLeadToSheet(name, place, helpNeeded, phone) {
    if (!SPREADSHEET_ID) throw new Error("Missing GOOGLE_SPREADSHEET_ID in .env");
    
    try {
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:E', // Assuming the data goes into Sheet1
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [timestamp, name, place, helpNeeded, phone]
                ]
            }
        });
        console.log(`Successfully appended lead: ${name} to Google Sheets.`);
        return response.data;
    } catch (error) {
        console.error("Error appending to sheet:", error);
        throw error;
    }
}

/**
 * Checks if a specific time slot is free on Google Calendar.
 * times should be ISO string format.
 */
async function checkCalendarAvailability(startTimeISO, endTimeISO) {
    if (!CALENDAR_ID) throw new Error("Missing GOOGLE_CALENDAR_ID in .env");

    try {
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: startTimeISO,
            timeMax: endTimeISO,
            singleEvents: true,
        });
        
        const events = response.data.items;
        if (events && events.length > 0) {
            // There are overlapping events
            return false;
        }
        return true; // Free
    } catch (error) {
        console.error("Error checking calendar:", error);
        throw error;
    }
}

/**
 * Books an appointment on Google Calendar.
 */
async function bookAppointment(startTimeISO, endTimeISO, userName, userPhone) {
    if (!CALENDAR_ID) throw new Error("Missing GOOGLE_CALENDAR_ID in .env");

    try {
        const event = {
            summary: `Meeting with ${userName}`,
            description: `Automated booking via AI bot.\nPhone: ${userPhone}`,
            start: {
                dateTime: startTimeISO,
                timeZone: 'Asia/Kolkata',
            },
            end: {
                dateTime: endTimeISO,
                timeZone: 'Asia/Kolkata',
            },
        };

        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
        });

        console.log(`Successfully booked appointment for ${userName}: ${response.data.htmlLink}`);
        return response.data;
    } catch (error) {
        console.error("Error booking appointment:", error);
        throw error;
    }
}

module.exports = {
    appendLeadToSheet,
    checkCalendarAvailability,
    bookAppointment
};
