import axios from "axios";

const endpoint = "https://www.linkedin.com";

const AxiosInstance = axios.create({
  baseURL: endpoint,
});

export const Axios =  axios

export default AxiosInstance