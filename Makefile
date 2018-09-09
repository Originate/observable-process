.DEFAULT_GOAL := spec

# platform-specificity
ifdef ComSpec
	/ := $(strip \)
else
	/ := /
endif


build: clean  # builds the production version
	@mkdir dist
	@node_modules$/.bin$/tsc -p .

clean:  # removes all build artifacts
	@rm -rf dist

cuke: build  # runs the feature specs
	@node_modules$/.bin$/cucumber-js

deploy: build  # deploys a new version to npmjs.org
	npm publish

docs: build   # runs the documentation tests
	@node_modules$/.bin$/text-run --offline

fix:
	tslint --project tsconfig.json --fix
	prettier --write src/*.ts
	prettier --write **/*.md

help:   # prints all make targets
	@cat Makefile | grep '^[^ ]*:' | grep -v '.PHONY' | grep -v help | sed 's/:.*#/#/' | column -s "#" -t

lint:   # runs the linters
	node_modules$/.bin$/tsc --noEmit
	node_modules/.bin/prettier -l "src/**/*.ts"
	node_modules/.bin/prettier -l "**/*.md"

setup:   # sets up the installation on this machine
	node_modules$/o-tools$/bin$/check-paths
	yarn install

spec: lint cuke docs   # runs all tests

update:  # updates the dependencies
	yarn upgrade --latest
