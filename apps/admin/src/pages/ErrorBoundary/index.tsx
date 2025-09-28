import React from "react";

class ErrorBoundaryComp extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            hasError: false
        };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.log(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div>出错了： {this.state.message}</div>;
        }
        return this.props.children;
    }
}


const Box = () => {
    let a = null
    return <div>{(a as any).asd}</div>;
}

const ErrorBoundary = () => {
    return <ErrorBoundaryComp ><Box /></ErrorBoundaryComp>;
}

export default ErrorBoundary;