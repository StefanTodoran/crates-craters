enum EscapeCode {
    GREEN = "\x1b[32m",
    YELLOW = "\x1b[33m",
    RED = "\x1b[31m",
    RESET = "\x1b[0m",
}

export enum LogStatus {
    GOOD,
    WARNING,
    ERROR,
}

export function log(content: string, status?: LogStatus) {
    let startCode = "";
    switch (status) {
        case LogStatus.GOOD:
            startCode = EscapeCode.GREEN;
            break;
        case LogStatus.WARNING:
            startCode = EscapeCode.YELLOW;
            break;
        case LogStatus.ERROR:
            startCode = EscapeCode.RED;
            break;
    
        default:
            break;
    }

    console.log(startCode + content + EscapeCode.RESET);
}