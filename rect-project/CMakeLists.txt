cmake_minimum_required (VERSION 3.6)

project(rect-project)

add_executable(rect-project main.cc)
set_target_properties (rect-project PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/${CMAKE_BUILD_TYPE}")
#target_link_options (rect-project PUBLIC "-sEXPORTED_FUNCTIONS=[\"_getPlaneVertex\"]")
target_link_options (rect-project PUBLIC "-sEXTRA_EXPORTED_RUNTIME_METHODS=[\"ccall\", \"cwrap\"]")
target_link_options (rect-project PUBLIC -sALLOW_MEMORY_GROWTH=1 --no-heap-copy --bind -s EXPORT_ES6=1)
set (WebSiteSourcesFolder ../app/cpp-build)
get_filename_component (WebSiteSourcesFolderFullPath "${WebSiteSourcesFolder}" ABSOLUTE)

add_custom_command(TARGET rect-project POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory $<TARGET_FILE_DIR:rect-project> "${WebSiteSourcesFolderFullPath}" 
    COMMENT "Copying output to public folder"
)