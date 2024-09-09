/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO(developer): Set to client ID and API key from the Developer Console
const API_KEY = 'AIzaSyB3EOx24XRRrxQ9N60WS2ljDAX6Q86MkVc';
const CLIENT_ID = '983437923698-shfpf6udie0o0akgoa3caj7bdvonkhvo.apps.googleusercontent.com';
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
        await listFiles(token);
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

/**
 * Print metadata for first 10 files.
 */
async function listFiles() {
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
        const thumbnail_area = document.getElementById('thumbnails-area');
        const img = document.createElement('img');
        thumbnail_area.appendChild(img);
        img.src = `https://drive.google.com/thumbnail?authuser=0&sz=w50-h50&id=${file.id}`
        const max_retries = 3;
        let retry_count = 0
        img.onerror = () => {
            if (retry_count > max_retries) {
                return
            }
            window.setTimeout(() =>
            {
                retry_count++
                img.src = img.src
            },1000)


        }
        file.thumbnailLink;
    });
    //document.getElementById('thumbnails-area').innerText = output;
}
// gapi.load('client:auth2', () => {
//     gapi.client.init({
//         apiKey: 'AIzaSyB3EOx24XRRrxQ9N60WS2ljDAX6Q86MkVc',
//         clientId: '983437923698-shfpf6udie0o0akgoa3caj7bdvonkhvo.apps.googleusercontent.com',
//         discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
//         scope: 'https://www.googleapis.com/auth/drive'
//     }).then(() => {
//         // Check if the user is already signed in.
//         if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
//             listFiles(); // Call your function to interact with Google Drive
//         } else {
//             // If not signed in, use popup mode for the sign-in process
//             gapi.auth2.getAuthInstance().signIn({
//                 ux_mode: 'popup' // Use popup mode to avoid COOP issues
//             }).then(() => {
//                 listFiles(); // After signing in, proceed to list files
//             }).catch((error) => {
//                 console.error("Sign-in error:", error);
//             });
//         }
//     }).catch((error) => {
//         console.error("Error during gapi.client.init:", error);
//     });
// });

export function signIn() {
    gapi.auth2.getAuthInstance().signIn({
        ux_mode: 'popup'
    }).then(listFiles);
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
async function getThumbnailUrl(fileId) {
    const token = gapi.client.getToken().access_token  
    console.log('TU', token)

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&thumbnailMode=OUT_OF_BOUNDS&thumbnailSize=SMALL&thumbnailFormat=JPEG`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })// Example fetch request that returns a ReadableStream
    fetch(url)
    .then(response => response.body)
    .then(async stream => {
      const reader = stream.getReader();
      const chunks = [];
      return reader.read().then(function processChunk({ done, value }) {
        if (done) {
          // All chunks have been read
          return new Blob(chunks);  // Convert chunks to a Blob
        }
        chunks.push(value);
        return reader.read().then(processChunk);
      });
    })
    .then(blob => {
      // Now you have a Blob object
      console.log('Received Blob:', blob);
  
      // Example: Download the Blob as a file
      const url = URL.createObjectURL(blob);
      console.log('url: ', url)
      const a = document.createElement('a');
      a.href = url;
      a.download = 'file.bin';  // Replace with your desired file name
      document.body.appendChild(a);
      a.click();  // Trigger the download
      URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
    

    if (response.ok) {
        const thumbnailBlob = stream_to_blob(response.body);
        return response.url;
    } else {
        throw new Error('Failed to fetch thumbnail');
    }
}
async function displayThumbnail(fileId) {
    try {
        const thumbnailUrl = await getThumbnailUrl(fileId);
        const thumbnail_area = document.getElementById('thumbnails-area');
        const img = document.createElement('img');
        thumbnail_area.appendChild(img);
        img.src = thumbnailUrl;
    } catch (error) {
        console.error('Error displaying thumbnail:', error);
    }
}