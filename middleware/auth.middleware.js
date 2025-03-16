import jwt from "jsonwebtoken"

export const isLoggedIn = async (req, res, next) => {
    try {
        console.log(req.cookies);
        let token = req.cookies.token || ""

        console.log("Token found:- ", token ? "YES" : "NO");

        if (!token) {
            console.log("No token");
            return res.status(401).json({
                message: "Authentication Failed",
                success: false
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET,)
        console.log("decoded data", decoded);
        req.user = decoded

        next()

    } catch (error) {
        console.log("Auth middleware failure", error.message);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error
        })
    }

    // next()
}


// 55:41 se baaki