/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO(developer): Set to client ID and API key from the Developer Console
const API_KEY = '';
const CLIENT_ID = '';
// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

//document.getElementById('authorize_button').style.visibility = 'hidden';
//document.getElementById('signout_button').style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */


/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
export async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}
function gapiLoaded() {
    console.log('GAPI')
    gapi.load('client', initializeGapiClient);
}
/**
 * Callback after Google Identity Services are loaded.
 */
export function initializeGis() {
    console.log('GIS')
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}
function add_gdrive_script_tag(src, callback) {
    const script_tag = document.createElement('script');
    script_tag.src = src;
    script_tag.onload = callback
    document.head.appendChild(script_tag);
}

function link_callback_to_button(button_id, callback) {
    const button_tag = document.getElementById(button_id);
    button_tag.onclick = callback;
}
function link_buttons() {
    link_callback_to_button('authorize_button', handleAuthClick)
    link_callback_to_button('signout_button', handleSignoutClick)
}

export function add_gdrive_script_tags() {
    add_gdrive_script_tag('https://accounts.google.com/gsi/client', initializeGis);
    add_gdrive_script_tag('https://apis.google.com/js/api.js', gapiLoaded);
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
    console.log('MAYBE')
    link_buttons();

    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}
/**
 * Enables user interaction after all libraries are loaded.
 */

/**
 *  Sign in the user upon button click.
 */
export function handleAuthClick() {
    console.log('AUTH');
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';
        const token = gapi.client.getToken().access_token;
        await list_files();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
    }
    console.log('Token: ', gapi.client.getToken())
}

/**
 *  Sign out the user upon button click.
 */
export function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerText = '';
        document.getElementById('authorize_button').innerText = 'Authorize';
        document.getElementById('signout_button').style.visibility = 'hidden';
    }
}
function get_thumbnail_img(file_id, callback) {
    const access_token = gapi.client.getToken().access_token
    // Make a GET request to the Files API
    fetch(`https://www.googleapis.com/drive/v3/files/${file_id}?fields=thumbnailLink`, {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            const thumbnailLink = data.thumbnailLink;

            // Make a GET request to the thumbnail link
            fetch(thumbnailLink, {
                headers: {
                    Accept: 'image/png'
                }
            })
                .then(response => response.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const img = new Image();
                    callback(img);
                })
                .catch(error => {
                    console.error(error);
                });
        })
        .catch(error => {
            console.error(error);
        });
}
/**
 * Print metadata for first 10 files.
 */
async function list_files() {
    let response;
    try {
        response = await gapi.client.drive.files.list({
            'pageSize': 10,
            'fields': 'files(id, name, thumbnailLink)',
            'q': 'parents="1FTfqF3-fC0f6Peel0sTr5EF3ILblMlCg"',
        });
    } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
    }
    const files = response.result.files;
    if (!files || files.length == 0) {
        document.getElementById('content').innerText = 'No files found.';
        return;
    }
    // Flatten to string to display
    files.forEach(file => {
        //thumbnailLink
        const modal = document.getElementById('modal');
        get_thumbnail_img(file.id, (img) => {
            modal.appendChild(img);

        })
    });
    //document.getElementById('thumbnails-area').innerText = output;
}

export function signIn() {
    gapi.auth2.getAuthInstance().signIn({
        ux_mode: 'popup'
    }).then(list_files);
}
async function stream_to_blob(stream) {
    const chunks = [];

    while (true) {
        const { value, done } = await stream.read();
        if (done) {
            break;
        }
        chunks.push(value);
    }

    return new Blob(chunks, { type: 'image/png' });
}
