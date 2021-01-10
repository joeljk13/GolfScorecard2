SRC = Makefile $(shell find src/ -type f)

site: $(SRC)
	xdg-open src/main.html >/dev/null 2>&1

tags: $(SRC)
	ctags -R src/ Makefile
