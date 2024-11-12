export class GoogleDrive {
    static client_id: string = '983437923698-shfpf6udie0o0akgoa3caj7bdvonkhvo.apps.googleusercontent.com'
    static client_secret: string = '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'
    static api_key: string = 'AIzaSyB3EOx24XRRrxQ9N60WS2ljDAX6Q86MkVc'
    static oauth2Endpoint: string = 'https://accounts.google.com/o/oauth2/v2/auth'
    access_token: string | undefined;
    // params:Map<string,string>;
    constructor(hash_on_page_load: string) {
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
    initiate_open_tab(token_callback: (token: string) => void) {
        if (this.access_token != undefined) {
            token_callback(this.access_token);
            return
        }
        const popup = window.open("/login", "formPopup", "width=10,height=10")!;
        // HACK: "setTimeout" loop until the popup aquired the access_token
        const _this = this
        function redirected_poller() {
            const mtch = popup.location.hash.match('access_token=([^&]+)(&|$)')

            if (mtch != null) {
                _this.access_token = mtch[1]
                token_callback(_this.access_token)
            } else {
                setTimeout(redirected_poller, 500)
            }
        };
        redirected_poller();
    }
    open_picker(img_selected_callack: (url: string) => void) {
        const _this = this
        function picker_callback(access_token: string, data: google.picker.PickerResponse) {
            if (data.action === google.picker.Action.PICKED) {
                const selectedFile: any = data.docs.find(
                    file => file.mimeType === 'image/png');
                if (selectedFile) {
                    const url = `https://www.googleapis.com/drive/v3/files/${selectedFile.id}?alt=media`;
                    console.log('Fetching image')
                    fetch(url, {
                        headers: {
                            Authorization: `Bearer ${access_token}` // Access token from Google Drive API
                        }
                    }).then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.blob();
                    })
                        .then(blob => {
                            img_selected_callack(URL.createObjectURL(blob));
                            // const image_element:HTMLImageElement = new Image();
                            
                            // image_element.src = imageUrl;

                            // document.body.append(image_element);
                        })
                }
            }

        }
        this.initiate_open_tab((access_token) => {
            function create_picker() {
                const picker_builder: google.picker.PickerBuilder = new (google.picker.PickerBuilder as any)();
                const picker = picker_builder.addView(google.picker.ViewId.DOCS)
                    .setOAuthToken(access_token)
                    .setDeveloperKey(GoogleDrive.api_key)
                    .setCallback((data: google.picker.PickerResponse) => picker_callback(access_token, data))
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


}


