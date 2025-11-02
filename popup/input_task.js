// help:
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_second_WebExtension

const GOOGLE_CLIENT_ID = "675648381105-22qg8c45pnvsei81qep64k8tf5rbjba9.apps.googleusercontent.com";
const TOKEN_LOCAL_STORAGE_KEY = "taskme_google_calendar_access_token";

function authenticate(callback) {
    if (localStorage.getItem(TOKEN_LOCAL_STORAGE_KEY)) {
        if (callback) callback(localStorage.getItem(TOKEN_LOCAL_STORAGE_KEY));
    } else {
        const redirectURI = browser.identity.getRedirectURL() + 'callback';
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: redirectURI,
            response_type: 'token',
            scope: 'https://www.googleapis.com/auth/calendar',
        });
        let url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        browser.identity.launchWebAuthFlow({
            interactive: true,
            url: url
        }).then((redirectURL) => {
            // get the access token
            let params = new URLSearchParams((new URL(redirectURL)).hash.substring(1));
            let token = params.get('access_token');
            localStorage.setItem(TOKEN_LOCAL_STORAGE_KEY, token);
            if (callback) callback(token);
        }).catch((error) => {
            console.error("Authentication failed:", error);
        });
    }
}

function buildCalendarEvent(body) {
    return {
        "kind": "calendar#event",
        "htmlLink": body.htmlLink || "",
        "summary": body.summary || "",
        "description": body.description,
        "location": body.location,
        "start": body.start,
        "end": body.end,
        "eventType": "default",
        "source": {
            url: 'http://waterbuffalocoffeemilkjello.tech',
            title: 'TaskMe Extension'
        }
    };
}

function reauthenticate(callback) {
    localStorage.removeItem(TOKEN_LOCAL_STORAGE_KEY);
    authenticate(callback);
}

function getUserCalendars(token, callback) {
    fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    }).then(response => response.json()).then(data => {
        if (data.error) {
            console.log(data);
            console.error(data.error);
        }
        if (callback) callback(data);
    }).catch(error => {
        console.error("Error fetching user calendars:", error);
    });
}

function getPrimaryCalendarId(calendarList) {
    for (let item of calendarList.items) {
        if (item.primary) {
            return item.id;
        }
    }
    if (calendarList.items.length > 0) {
        return calendarList.items[0].id;
    }
    console.error("No calendars found for user.");
    return null;
}

function createCalendarEvent(calendarId, eventBody, token, callback) {
    // https://www.googleapis.com/calendar/v3/calendars/calendarId/events
    fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
    }).then(response => response.json()).then(data => {
        if (callback) callback(data);
    }).catch(error => {
        console.error("Error creating calendar event:", error);
    });
}

function getCurrentTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}


var previewingEvent = false;
var previewEventData = null;
var lastPrompt = "";

// --- New: submit form on Enter and handle submission ---
const loginContainer = document.getElementById('authButtons');
const authorizeButton = document.getElementById('authorizeButton');
const signoutButton = document.getElementById('signOutButton');
const form = document.getElementById('taskForm');
const input = document.getElementById('task');
const loadingIndicator = document.getElementById('loadingIndicator');
const eventPreview = document.getElementById('eventPreview');
const previewRetryButton = document.getElementById('retryButton');
const submitButton = document.getElementById('addTaskButton');
const successBanner = document.getElementById('successBanner');
const testButton = document.getElementById('testButton');
const confirmEventButton = document.getElementById('confirmEventButton');

eventPreview.classList.add('hidden');
successBanner.classList.add('hidden');

function showLogin() {
    form.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    eventPreview.classList.add('hidden');
}

function showForm() {
    loginContainer.classList.add('hidden');
    form.classList.remove('hidden');
    eventPreview.classList.add('hidden');
    submitButton.classList.remove('hidden');
}

function showPreview() {
    loginContainer.classList.add('hidden');
    form.classList.add('hidden');
    eventPreview.classList.remove('hidden');
    successBanner.classList.add('hidden');
}

if (localStorage.getItem(TOKEN_LOCAL_STORAGE_KEY)) {
    showForm();
} else {
    showLogin();
}

if (input) {
    input.focus();
}

if (authorizeButton) {
    authorizeButton.addEventListener('click', () => {
        authenticate(token => {
            showForm();
        });
    });
}

if (signoutButton) {
    signoutButton.addEventListener('click', () => {
        localStorage.removeItem(TOKEN_LOCAL_STORAGE_KEY);
        showLogin();
    });
}

if (testButton) {
    testButton.addEventListener('click', () => {
        authenticate(token => {
            getUserCalendars(token, (calList) => {
            });
        });
    });
}

if (confirmEventButton) {
    confirmEventButton.addEventListener('click', () => {
        if (!previewingEvent) return;
        var fullEventData = buildCalendarEvent(previewEventData);
        authenticate(token => {
            getUserCalendars(token, (calList) => {
                const calendarId = getPrimaryCalendarId(calList);
                if (calendarId) {
                    createCalendarEvent(calendarId, fullEventData, token, (createdEvent) => {
                        console.log("Event created successfully:", createdEvent);
                        successBanner.classList.remove('hidden');
                        previewingEvent = false;
                        previewEventData = null;
                        // reset the form
                        showForm();
                        input.value = '';
                        input.focus();
                    });
                } else {
                    console.error("No calendar ID found.");
                }
            });
        });
    });
}

if (previewRetryButton) {
    previewRetryButton.addEventListener('click', () => {
        showForm();
        input.value = lastPrompt;
        previewingEvent = false;
        previewEventData = null;
    });
}

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = input && input.value ? input.value.trim() : '';
        if (!value) return; // don't submit empty tasks
        lastPrompt = value;
        loadingIndicator.classList.remove('hidden');
        submitButton.classList.add('hidden');
        successBanner.classList.add('hidden');
        reauthenticate(token => {
            // guess the calendar event details from the input value
            fetch('https://api.veggiebob.com/taskme/guess-cal-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({input: value + '; Timezone is ' + getCurrentTimezone()}),
            }).then(response => response.json()).then(data => {
                loadingIndicator.classList.add('hidden');
                // create the calendar event
                const body = data.body;
                const eventSummary = body.summary;
                const eventDescription = body.description;
                const eventLocation = body.location;
                const allDayEvent = !!body.start.date;
                const eventStart = allDayEvent ? body.start.date : body.start.dateTime;
                const eventEnd = allDayEvent ? body.end.date : body.end.dateTime;
                // set the content
                document.getElementById('EventSummary').textContent = eventSummary || '';
                document.getElementById('EventStart').textContent = eventStart || '';
                document.getElementById('EventEnd').textContent = eventEnd || '';
                document.getElementById('EventDescription').textContent = eventDescription || '';
                document.getElementById('EventLocation').textContent = eventLocation ? 'Located at ' + eventLocation : '';
                // show the preview
                const eventPreview = document.getElementById('eventPreview');
                eventPreview.classList.remove('hidden');
                // hide the form
                showPreview();
                confirmEventButton.focus();
                previewingEvent = true;
                previewEventData = body;
            }).catch(error => {
                console.error("Error guessing event data:", error);
            });
        });
    });

    // Optional: allow pressing Escape to close the popup
    input && input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.close();
    });
}