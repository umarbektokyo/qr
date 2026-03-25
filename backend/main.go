package main

import (
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
)

func main() {
	mux := http.NewServeMux()

	distDir := "../frontend/dist"
	if _, err := os.Stat(distDir); err == nil {
		frontendFS := http.FileServer(http.Dir(distDir))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			if path == "/" {
				path = "/index.html"
			}
			if _, err := fs.Stat(os.DirFS(distDir), strings.TrimPrefix(path, "/")); err != nil {
				http.ServeFile(w, r, distDir+"/index.html")
				return
			}
			frontendFS.ServeHTTP(w, r)
		})
	} else {
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			fmt.Fprint(w, "<h1>Frontend not built. Run: cd frontend && npm run build</h1>")
		})
	}

	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}
	log.Printf("QR Generator running at http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
