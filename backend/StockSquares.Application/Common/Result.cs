namespace StockSquares.Application.Common;

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public string Message { get; private set; }
    public string? ErrorCode { get; set; }
    public T? Data { get; private set; }
    public IDictionary<string, string[]>? Errors { get; private set; }

    private Result(bool isSuccess, string message, string? errorCode, T? data, IDictionary<string, string[]>? errors = null)
    {
        IsSuccess = isSuccess;
        Message = message;
        ErrorCode = errorCode;
        Data = data;
        Errors = errors;
    }

    public static Result<T> Success(T data, string message = "Operation completed successfully")
    {
        return new Result<T>(true, message, null, data);
    }

    public static Result<T> Failure(string message, string errorCode = "OPERATION_FAILED")
    {
        return new Result<T>(false, message, errorCode, default);
    }

    public static Result<T> ValidationError(IDictionary<string, string[]> errors, string message = "Validation failed")
    {
        return new Result<T>(false, message, "VALIDATION_ERROR", default, errors);
    }
}
