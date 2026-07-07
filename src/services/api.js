import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
// axios.defaults.headers.common['Content-Type'] = 'application/json';
// axios.defaults.headers.common['Authorization'] = import.meta.env.VITE_AUTHORIZATION_KEY;


// 1. Post Request with Multipart Form Data (For File Uploads)
export const postRequestWithFile = async (URL, requestData, callback) => {
    try {
        let userDetails = JSON.parse(localStorage.getItem('user_details')) || {};

        let headers = {
            "Authorization": import.meta.env.VITE_AUTHORIZATION_KEY
        };
        if (userDetails?.access_token || userDetails?.accesstoken) {
            headers["accesstoken"] = userDetails.access_token || userDetails.accesstoken;
        }
        const response = await axios({
            method: "POST",
            url: URL,
           
            data: requestData,
             headers
            
        });

        if (callback) {
            return callback(response);
        }
        return response;

    } catch (err) {
        if (callback) {
            return callback(err.response || err);
        }
        throw err;
    }
}

// 2. Standard Post Request (JSON)
export const postRequest = async (URL, requestData, callback) => {
    try {
        let userDetails = JSON.parse(localStorage.getItem('user_details')) || {};

        let headers = {
            "Content-Type": "application/json",
            "Authorization": import.meta.env.VITE_AUTHORIZATION_KEY
        };
        if (userDetails?.access_token || userDetails?.accesstoken) {
            headers["accesstoken"] = userDetails.access_token || userDetails.accesstoken;
        }

        const response = await axios({
            method: "POST",
            url: URL,
            data: requestData,
            headers
        });

        if (callback) return callback(response);
        return response;

    } catch (err) {
        if (callback) return callback(err.response || err);
        throw err;
    }
}

// 3. Standard Get Request
export const getRequest = async (URL, requestData, callback) => {
    try {
        let userDetails = JSON.parse(localStorage.getItem('user_details')) || {};
        let headers = {
            "Content-Type": "application/json",
            "Authorization": import.meta.env.VITE_AUTHORIZATION_KEY
        };
        if (userDetails?.access_token || userDetails?.accesstoken) {
            headers["accesstoken"] = userDetails.access_token || userDetails.accesstoken;
        }

        const response = await axios({
            method: "GET",
            url: URL,
            params: requestData,
            headers
        });

        if (callback) return callback(response);
        return response;
    } catch (err) {
        console.log("API GET request error:", err);
        if (callback) return callback(err.response || err);
        throw err;
    }
}

// 4. Standard Delete Request
export const deleteRequest = async (URL, requestData, callback) => {
    try {
        let userDetails = JSON.parse(localStorage.getItem('user_details')) || {};
        let headers = {
            "Content-Type": "application/json",
            "Authorization": import.meta.env.VITE_AUTHORIZATION_KEY
        };
        if (userDetails?.access_token || userDetails?.accesstoken) {
            headers["accesstoken"] = userDetails.access_token || userDetails.accesstoken;
        }

        const response = await axios({
            method: "DELETE",
            url: URL,
            data: requestData,
            headers
        });

        if (callback) return callback(response);
        return response;
    } catch (err) {
        console.log("API DELETE request error:", err);
        if (callback) return callback(err.response || err);
        throw err;
    }
}
