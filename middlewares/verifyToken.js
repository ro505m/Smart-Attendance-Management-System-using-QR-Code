import jwt from "jsonwebtoken";


function verifyToken(req, res, next){
    let token = req.headers["authorization"];
    if (token && token !== undefined){
        token = token.split(' ')[1];
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET_KEY)
            req.user = decode;
            next();
        } catch (error) {
            res.status(401).json({message: "Invalid token"});
        }
    }else{
        res.status(401).json({message: "No token provided"});
    }
}

export function verifyUserToken(req, res, next){
    verifyToken(req, res, ()=>{
        if(req.user.userAgent === req.headers['user-agent'])
            next()
        else
            res.status(403).json({message: "you are not allowed!"})
    })
}

export function verifyInstructorToken(req, res, next){
    verifyToken(req, res, ()=>{
        if(
            req.user.userAgent === req.headers['user-agent'] &&
            (req.user.role === 0 || req.user.role === 2)
        )
            next()
        else
            res.status(403).json({message: "you are not allowed!"})
    })
}

export function verifyAdminToken(req, res, next){
    verifyToken(req, res, ()=>{
        if(req.user && req.user.userAgent === req.headers['user-agent'] && req.user.role === 0)
            next()
        else
            res.status(403).json({message: "you are not allowed!"})
    })
}
