class ApiResponse {
    constructor(statusCode,data,message = "success"){
        this.statusCode = starcode
        this.data = data
        this.data = message
        this.success = statusCode < 400
    }
}

export {ApiResponse}