export class GoogleDrive {
    static client_id:string = '983437923698-shfpf6udie0o0akgoa3caj7bdvonkhvo.apps.googleusercontent.com'
    static client_secret:string = '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'
    static api_key:string = 'AIzaSyB3EOx24XRRrxQ9N60WS2ljDAX6Q86MkVc'
    static oauth2Endpoint:string  = 'https://accounts.google.com/o/oauth2/v2/auth'
    access_token:string|undefined;
    // params:Map<string,string>;
    constructor(hash_on_page_load:string) {
        // this.params = this.parse_hash(hash_on_page_load);
        // if (this.params.get('state') == 'open-picker') {
        //     this.open_picker(console.log);
        // }
    }
    // parse_hash(hash:string):Map<string,string> {
    //     const fragments = hash.replace('#', '').split('&');
    //     let params = new Map<string,string>();
    //     fragments.forEach(function(fragment:string, index:number) {
    //         const kv = fragment.split('=');
    //         const k = kv[0]
    //         const v = decodeURIComponent(kv[1]);
    //         params.set(k, v);
    //     });
    //     return params        
    // } 
initiate_open_tab(callback:(token:string)=>void) {
        const popup = window.open("/", "formPopup", "width=600,height=400")!;
        // HACK: "setTimeout" loop until the popup aquired the access_token
        function loop_until_popup_redirected() {
            console.log('loop')
            const mtch = popup.location.hash.match('access_token=([^&]+)(&|$)')
            
            if (mtch != null) {
                console.log(mtch[1])
                callback(mtch[1])
            } else {
                setTimeout(loop_until_popup_redirected, 1000)
            }
        };
        loop_until_popup_redirected();
    }
    assert_oauth(next_state:string) {
        if (this.params.get('access_token') == undefined) {
            this.oauth_sign_in(next_state)
            return
        }
        this.access_token = this.params.get('access_token');
    }
    open_picker(img_selected_callack:(url:string) => void) {
        if (this.access_token == null) {
            this.assert_oauth('open-picker')
            if (this.access_token == null) {
                return
            }
        }
        const api_key = GoogleDrive.api_key;
        function picker_callback(data:google.picker.PickerResponse) {
            if (data.action === google.picker.Action.PICKED) {
                const selectedFile:any = data.docs.find(
                    file => file.mimeType === 'image/png');
                if (selectedFile) {
                    img_selected_callack(selectedFile.url);
                } else {
                    console.log("No PNG file selected.");
                }
            }
                let fileId = data.docs[0].id;
            console.log("Picked file ID:", fileId);
        }
        this.initiate_open_tab((access_token) => {
            function create_picker() {            
                const picker_builder:google.picker.PickerBuilder = new (google.picker.PickerBuilder as any)();
                const picker = picker_builder.addView(google.picker.ViewId.DOCS)
                    .setOAuthToken(access_token)
                    .setDeveloperKey(api_key)
                    .setCallback(picker_callback)
                    .build();
                picker.setVisible(true);
            }
            if (google.picker != undefined) {
                create_picker()
            } else {
                gapi.load('picker', { 'callback': create_picker });
            }
        });
    }

    oauth_sign_in(next_state:string) {
        if (this.access_token != null) {
            return;
        }
    
      // Google's OAuth 2.0 endpoint for requesting an access token
    
      // Create <form> element to submit parameters to OAuth 2.0 endpoint.
      const form:HTMLFormElement = document.createElement('form');
      form.setAttribute('method', 'GET'); // Send as a GET request.
      form.setAttribute('action', GoogleDrive.oauth2Endpoint);
    
      // Parameters to pass to OAuth 2.0 endpoint.
      const params:Map<string,string> = new Map(
        [['client_id', '983437923698-shfpf6udie0o0akgoa3caj7bdvonkhvo.apps.googleusercontent.com'],
        ['redirect_uri', 'http://localhost:8080/'],
        ['response_type', 'token'],
        ['scope', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
        ['include_granted_scopes', 'true'],
        ['state', next_state]]);
    
      // Add form parameters as hidden input values.
      params.forEach((value, key) => {
        var input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', key);
        input.setAttribute('value', value);
        form.appendChild(input);
      })
    
      // Add form to page and submit it to open the OAuth 2.0 endpoint.
      document.body.appendChild(form);
//      form.submit();
    }

}


