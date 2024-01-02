.PHONY: help reset setup build serve

.DEFAULT=help
help:
	@echo "reset        Clear node_modules"
	@echo "setup        Setup node_modules"
	@echo "build        Build the source"
	@echo "serve 		Serve the code"

reset:
	rm -f package-lock.json
	rm -rf node_modules/
	rm -rf dist/

setup:
	npm install

build:
	npx vite build

serve:
	python3 -m http.server -d dist/
