import { ApiError } from "./apiError.js";

class ApiResponse {
  constructor(statusCode, data, message = "Successfully done") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

const message = (res, type, status_code, message) => {
  if (type === 'res') {
    return res.json(new ApiResponse(status_code, message))
  }
  else if (type === 'err') {
    return res.json(new ApiError(status_code, message))
  }
  else {
    return res.json(new ApiResponse(422, 'invalid type of response'))
  }
}

export { ApiResponse, message };