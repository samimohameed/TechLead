using StockSquares.Domain.Enums;

namespace StockSquares.Application.Common;

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public string Message { get; private set; }
    public ErrorCode ErrorCode { get; set; }
    public T? Data { get; private set; }
    public IDictionary<string, string[]>? Errors { get; private set; }

    private Result(bool isSuccess, string message, ErrorCode errorCode, T? data, IDictionary<string, string[]>? errors = null)
    {
        IsSuccess = isSuccess;
        Message = message;
        ErrorCode = errorCode;
        Data = data;
        Errors = errors;
    }

    public static Result<T> Success(T data, string message = "Operation successful")
    {
        return new Result<T>(true, message, ErrorCode.None, data);
    }

    public static Result<T> Failure(string message, ErrorCode errorCode = ErrorCode.UnknownError)
    {
        return new Result<T>(false, message, errorCode, default);
    }

    public static Result<T> Failure(string message, string errorCodeName)
    {
        var code = Enum.TryParse<ErrorCode>(errorCodeName, true, out var parsed) ? parsed : ErrorCode.UnknownError;
        return new Result<T>(false, message, code, default);
    }

    public static Result<T> ValidationError(IDictionary<string, string[]> errors, string message = "Validation failed")
    {
        return new Result<T>(false, message, ErrorCode.ValidationError, default, errors);
    }
}
