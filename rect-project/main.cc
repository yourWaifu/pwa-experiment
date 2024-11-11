#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <list>
#include <stdlib.h>

struct Rect {
public:
    Rect(float _x, float _y, float _width, float _height):
        x(_x), y(_y), width(_width), height(_height)
    {

    }
    ~Rect() {

    }

    float x; 
    float y;
    float width; 
    float height;
};

float randomFloat(float min, float max) {
    return min + (static_cast<float>(rand()) / static_cast<float>(RAND_MAX)) * (max - min);
}

emscripten::val getRectList(int seed) {
    std::list<Rect> rectList{};
    srand(seed);
    const float minPos = -5.0;
    const float maxCanvasWidth = 700.0;
    const float maxCannasHeight = 200.0;
    const float minRectSize = 10.0;
    const float maxRectSize = 100.0;
    for (int i = 0; i < 10; i += 1) {
        Rect random{
            randomFloat(minPos, maxCanvasWidth), randomFloat(minPos, maxCannasHeight),
            randomFloat(minRectSize, maxRectSize), randomFloat(minRectSize, maxRectSize)
        };
        rectList.push_front(random);
    }
    std::vector<float> rectBuffer;
    rectBuffer.reserve(rectList.size() * (sizeof(Rect)/sizeof(float)));
    for (Rect& rect : rectList) {
        rectBuffer.push_back(rect.x); // copy
        rectBuffer.push_back(rect.y);
        rectBuffer.push_back(rect.width);
        rectBuffer.push_back(rect.height);
    }

    return emscripten::val(
        emscripten::typed_memory_view(rectBuffer.size(),
        (const float *)(rectBuffer.data())
        )
    );
}

EMSCRIPTEN_BINDINGS() {
    function("getRectList", &getRectList);
}