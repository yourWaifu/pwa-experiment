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
    for (int i = 0; i < 10; i += 1) {
        Rect random{randomFloat(0.0, 600.00), randomFloat(0.0, 200.0), randomFloat(10.0, 100.0), randomFloat(10.0, 200.0)};
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