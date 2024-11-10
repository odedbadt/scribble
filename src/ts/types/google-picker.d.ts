declare namespace google {
    namespace picker {
      function PickerBuilder(): PickerBuilder;
      enum Action {
        PICKED = 'picked',
        CANCEL = 'cancel',
      }
      enum ViewId {
        DOCS = 'DOCS',
        SPREADSHEETS = 'SPREADSHEETS',
        // Add other view types as needed
      }
      
      interface PickerBuilder {
        new(): PickerBuilder;
        addView(view: ViewId): PickerBuilder;
        setOAuthToken(token: string): PickerBuilder;
        setDeveloperKey(key: string): PickerBuilder;
        setCallback(callback: (data: PickerResponse) => void): PickerBuilder;
        build(): Picker;
      }
  
      interface Picker {
        setVisible(visible: boolean): void;
      }
  
      interface PickerResponse {
        action: Action;
        docs: Array<{ id: string; name: string; mimeType: string }>;
      }
    }
  }
  