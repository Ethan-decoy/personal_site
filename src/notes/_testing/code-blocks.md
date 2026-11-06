---
title: 代码块测试
date: 2026-05-30
---
# 代码块样式测试

## C++

```cpp
#include <iostream>
#include <string>
#include <vector>

class Point {
public:
    double x, y;

    Point(double x, double y) : x(x), y(y) {}

    double distanceTo(const Point& other) const {
        return std::hypot(x - other.x, y - other.y);
    }
};

int main() {
    std::vector<Point> points = {
        {0.0, 0.0},
        {3.0, 4.0}
    };
    double d = points[0].distanceTo(points[1]);
    std::cout << "Distance: " << d << std::endl;
    return 0;
}
```

## Rust

```rust
use std::collections::HashMap;
use std::error::Error;

#[derive(Debug)]
struct Config {
    host: String,
    port: u16,
    debug: bool,
}

fn parse_config(args: &[String]) -> Result<Config, Box<dyn Error>> {
    let mut map = HashMap::new();
    for pair in args.iter().skip(1) {
        let parts: Vec<&str> = pair.splitn(2, '=').collect();
        if parts.len() == 2 {
            map.insert(parts[0], parts[1]);
        }
    }
    Ok(Config {
        host: map.get("host").unwrap_or(&"127.0.0.1").to_string(),
        port: map.get("port").unwrap_or(&"8080").parse()?,
        debug: map.contains_key("debug"),
    })
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    match parse_config(&args) {
        Ok(cfg) => println!("{:?}", cfg),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

## Python

```python
#!/usr/bin/env python3
"""模块说明：展示 Python 语法高亮"""

from pathlib import Path
from dataclasses import dataclass
from typing import Optional

@dataclass
class FileEntry:
    path: str
    size: int
    modified: float

def scan_directory(target: str) -> list[FileEntry]:
    """扫描目录并返回文件信息"""
    results = []
    for p in Path(target).rglob("*"):
        if p.is_file():
            stat = p.stat()
            results.append(FileEntry(
                path=str(p),
                size=stat.st_size,
                modified=stat.st_mtime,
            ))
    return sorted(results, key=lambda x: x.size, reverse=True)

if __name__ == "__main__":
    entries = scan_directory("/tmp")
    for e in entries[:5]:
        print(f"{e.size:>10}  {e.path}")
```

## 命令行

```bash
#!/bin/bash
# 批量处理示例
set -euo pipefail

readonly OUTPUT_DIR="build"
readonly SOURCE="src/**/*.rs"

echo "=== Building project ==="

mkdir -p "$OUTPUT_DIR"

for file in $SOURCE; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        # 处理逻辑
    fi
done

# 管道组合
find src/ -name "*.rs" | \
    grep -v "target" | \
    xargs wc -l | \
    sort -n

echo "Done. Total files: $(find src/ -name '*.rs' | wc -l)"
```

## 行内代码

`echo "hello"` | `cargo build` | `rustc --version`
