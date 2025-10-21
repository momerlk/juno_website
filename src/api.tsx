const urls = {
  testing : "http://localhost:8080/api/v1",
  production : "https://junoapi-710509977105.asia-south2.run.app/api/v1"
}
export const api_url = urls.production;

export async function createEvent(name : string, data : any){
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    "name": name,
    "data": data
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  const resp = await fetch(`${api_url}/events`, requestOptions as any)

  return resp.ok; 
}

export async function uploadFileAndGetUrl(
  eventFile: File, 
  url: string = api_url + '/files/upload'
): Promise<string> {
  const file = eventFile;
  
  if (!file) {
    throw new Error('No file selected');
  }
  
  console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
  
  // Create FormData and append the file
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Send the request
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      } catch (err) {
        if (err instanceof SyntaxError) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        throw err;
      }
    }
    
    const data = await response.json();
    
    if (data.success && data.file && data.file.url) {
      console.log('File uploaded successfully:', data.file.url);
      return data.file.url;
    } else {
      throw new Error('Invalid response format or missing URL');
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

export async function sellerLogin(request: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${api_url}/seller/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log(`response = ${JSON.stringify(response)}`)


    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData: LoginResponse = await response.json();
    return jsonData;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getSellerProfile(token: string): Promise<any> {
  const bearer = `Bearer ${token}`;

  const requestOptions = {
    method: "GET",
    headers: {
      "Authorization": bearer,
    },
  };

  const response = await fetch(`${api_url}/seller/profile`, requestOptions)
  if (!response.ok) {
    throw new Error(`HTTP Error! status: ${response.status}`);
  }

  const data = await response.json();

  return data;
}

export async function uploadProductCatalogue(token : string, file : File){
  const bearer = `Bearer ${token}`;

  const formData = new FormData();
  formData.append("file", file);

  const requestOptions = {
    method: "POST",
    headers: {
      "Authorization": bearer,
    },
    body: formData,
  };

  const response = await fetch(`${api_url}/seller/shopify`, requestOptions)
  if (!response.ok) {
    throw new Error(`HTTP Error! status: ${response.status}`);
  }

  const data = await response.json();

  return data;
}

export interface LoginResponse {
  token: string;
  user: any;
}

interface LoginRequest {
  device_info: {
    app_version: string;
    device_id: string;
    device_name: string;
    device_type: string;
    ip_address: string;
    last_used: string;
    os_version: string;
    user_agent: string;
  };
  email: string;
  password: string;
}