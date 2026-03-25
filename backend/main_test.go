package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func setupTestDist(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<!DOCTYPE html><html><body>QR</body></html>"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(dir, "assets"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "assets", "app.js"), []byte("console.log('ok')"), 0644); err != nil {
		t.Fatal(err)
	}
	return dir
}

func buildMux(distDir string) *http.ServeMux {
	mux := http.NewServeMux()
	if _, err := os.Stat(distDir); err == nil {
		frontendFS := http.FileServer(http.Dir(distDir))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			if path == "/" {
				path = "/index.html"
			}
			cleanPath := filepath.Clean(path)
			if cleanPath[0] == '/' {
				cleanPath = cleanPath[1:]
			}
			if _, err := os.Stat(filepath.Join(distDir, cleanPath)); err != nil {
				http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
				return
			}
			frontendFS.ServeHTTP(w, r)
		})
	}
	return mux
}

func TestServesIndexAtRoot(t *testing.T) {
	dir := setupTestDist(t)
	mux := buildMux(dir)

	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	body := w.Body.String()
	if body == "" {
		t.Error("expected non-empty body")
	}
}

func TestServesStaticAssets(t *testing.T) {
	dir := setupTestDist(t)
	mux := buildMux(dir)

	req := httptest.NewRequest("GET", "/assets/app.js", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestSPAFallbackToIndex(t *testing.T) {
	dir := setupTestDist(t)
	mux := buildMux(dir)

	req := httptest.NewRequest("GET", "/some/spa/route", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 (SPA fallback), got %d", w.Code)
	}
}
