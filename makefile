
# 
# 	platform.js
#

.PHONY: clean build

clean:
	del /Q .\dist\platform.js                                         >nul 2>&1

# 
# The files are listed manually as their order of compilation does matter.
# Core must come first, and bb must be imported before bbGun.
#
build: .\src
	jsx --verbose                                                             \
	    --src                                                                 \
		      .\src\libs\core\core.jsx                                        \
			  .\src\libs\shim.jsx                                             \
			  .\src\libs\check.jsx                                            \
			  .\src\libs\abc.jsx                                              \
			  .\src\libs\extras.jsx                                           \
			  .\src\libs\function.jsx                                         \
			  .\src\libs\math.jsx                                             \
			  .\src\libs\touchy.js                                            \
	          .\src\jsx.jsx                                                    \
			  .\src\compiler.jsx                                              \
			  .\src\bb.jsx                                                    \
			  .\src\bb-gun.jsx                                                \
	    --out .\dist\platform.js
	
