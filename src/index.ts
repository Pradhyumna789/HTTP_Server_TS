import express, { Request, Response, NextFunction } from "express";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

const middlewareLogResponses = (req: Request, res: Response, next: NextFunction): void => {
  res.on("finish", () => {
    if(res.statusCode !== 200) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
    }
  });

  next();
};

res.on("finish", () => {
  console.log(`[NON-OK] ${res}`);
})

const middlewareMetricsInc = (req: Request, res: Response, next: NextFunction) => {
  config.fileServerHits++; 
  next();
}

const validateChirpHandler = (req: Request, res: Response) => {
  let parsedBody: chirpBody;

  type chirpBody = {
    body: string,
  };

  type cleanedBody = {
    cleanedBody: string,
  };

  type errorBody = {
    error: string;  
  };

  type validityBody = {
    valid: boolean;
  };

  parsedBody = req.body;

  if (parsedBody.body.length <= 140) {
    const keywords = ["kerfuffle", "sharbert", "fornax"];
    
    let words = parsedBody.body.split(" ");
    for(let i = 0; i < words.length; i++) {
      const lowered = words[i].toLowerCase();
      if(keywords.includes(lowered)) {
        words[i] = "****";
      }
    }

    const response: cleanedBody = {
      cleanedBody: words.join(" "),
    };
    res.status(200).json(response);

  } else {
    const response: errorBody = {
      error: "Chirp is too long",
    };
    res.status(400).json(response);

  }
}

app.use("/app", middlewareMetricsInc, express.static("./src/app/"));
app.use(middlewareLogResponses);
app.use(express.json());

app.get("/app", (req, res) => {
  res.set("Cache-Control", "no-cache");
  res.send("Welcome to Chirpy");
});

app.get("/api/healthz", (req, res) => { 
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send("OK");
}); 

app.get("/admin/metrics", (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`
      <html>
      <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.fileServerHits} times!</p>
      </body>
    </html>
  `);
});

app.post("/api/validate_chirp", validateChirpHandler);

app.post("/admin/reset", (req, res) => {
  config.fileServerHits = 0;
  res.status(200).end();
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
