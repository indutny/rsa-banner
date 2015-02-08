SRC = $(wildcard lib/*.js)

all: dist/bundle.js

dist/bundle.js: src/app.js $(SRC)
	./node_modules/.bin/browserify $< -o $@

.PHONY: all
