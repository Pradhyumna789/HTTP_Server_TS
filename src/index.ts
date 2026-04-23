import express, { Request, Response, NextFunction } from "express"
import { config } from "./config.js"

const app = express()
const PORT = 8080

app.use(express.json())

class badRequestError extends Error {
  constructor(message: string) {
    super(message)
  }
}

class unauthorizedError extends Error {
  constructor(message: string) {
    super(message)
  }
}

class forbiddenError extends Error {
  constructor(message: string) {
    super(message)
  }
}

class notFoundError extends Error {
  constructor(message: string) {
    super(message)
  }
}

const middlewareErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if(err instanceof badRequestError) {
    res.status(400).json({ error: err.message })
  } else if(err instanceof notFoundError) {
    console.log(err.message)
    res.status(404).json({ error: "Nothing found on this resource" })
  } else if(err instanceof unauthorizedError) {
    console.log(err.message)
    res.status(401).json({ error: "You are unauthorized to access this resource" })
  } else if(err instanceof forbiddenError) {
    console.log(err.message)
    res.status(403).json({ error: "You don't have the sufficient rights to access this resource" })
  } else {
    res.status(500).json({ error: "Internal server error" })
  }
}

const middlewareLogResponses = (req: Request, res: Response, next: NextFunction): void => {
  res.on("finish", () => {
    if(res.statusCode !== 200) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`)
    }
  })

  next()
}

const middlewareMetricsInc = (req: Request, res: Response, next: NextFunction) => {
  config.fileServerHits++
  next()
}

const validateChirpHandler = async (req: Request, res: Response) => {
  let parsedBody: chirpBody

  type chirpBody = {
    body: string
  }

  type cleanedBody = {
    cleanedBody: string
  }

  type errorBody = {
    error: string
  }

  type validityBody = {
    valid: boolean
  }

  type invalidBody = {
    invalid: boolean
  } 

  parsedBody = req.body

    if (parsedBody.body.length <= 140) {
      const keywords = ["kerfuffle", "sharbert", "fornax"]
      
      let words = parsedBody.body.split(" ")
      for(let i = 0; i < words.length; i++) {
        const lowered = words[i].toLowerCase()
        if(keywords.includes(lowered)) {
          words[i] = "****"
        }
      }

      const response: cleanedBody = {
        cleanedBody: words.join(" ")
      }
      res.status(200).json(response)

    } else {
      throw new badRequestError("Chirp is too long. Max length is 140")
  }
}

app.use("/app", middlewareMetricsInc, express.static("./src/app/"))
app.use(middlewareLogResponses)

app.get("/app", (req, res) => {
  res.set("Cache-Control", "no-cache")
  res.send("Welcome to Chirpy")
})

app.get("/api/healthz", (req, res) => { 
  res.set("Content-Type", "text/plain; charset=utf-8")
  res.status(200).send("OK")
})

app.get("/admin/metrics", (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`
      <html>
      <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.fileServerHits} times!</p>
      </body>
    </html>
  `)
})

app.post("/api/validate_chirp", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await validateChirpHandler(req, res)
  } catch(err) {
    next(err)
  }
})

app.post("/admin/reset", (req, res) => {
  config.fileServerHits = 0
  res.status(200).end()
})

app.use(middlewareErrorHandler)

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
