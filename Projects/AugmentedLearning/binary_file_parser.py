# Copyright 2017 Google Inc.
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
# https://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import struct
from struct import unpack
import numpy as np


def unpack_drawing(file_handle):
    key_id, = unpack('Q', file_handle.read(8))
    countrycode, = unpack('2s', file_handle.read(2))
    recognized, = unpack('b', file_handle.read(1))
    timestamp, = unpack('I', file_handle.read(4))
    n_strokes, = unpack('H', file_handle.read(2))
    image = []
    for i in range(n_strokes):
        n_points, = unpack('H', file_handle.read(2))
        fmt = str(n_points) + 'B'
        x = unpack(fmt, file_handle.read(n_points))
        y = unpack(fmt, file_handle.read(n_points))
        image.append((x, y))

    return {
        'key_id': key_id,
        'countrycode': countrycode,
        'recognized': recognized,
        'timestamp': timestamp,
        'image': image
    }


def unpack_drawings(filename):
    with open(filename, 'rb') as f:
        while True:
            try:
                yield unpack_drawing(f)
            except struct.error:
                break


count = 0
pointMin = 1000
pointMax = 0
POINTS = 50
PATTERNS = 15000
ds = np.zeros([2*PATTERNS, POINTS], dtype=np.int32)
rows = 0
maxColumns = 0
for drawing in unpack_drawings('full_binary_bed.bin'):
    # do something with the drawing
    img = drawing['image']
    strokes = len(img)
    points = sum([len(p[0]) for p in img])
    if (points>30) and (points<POINTS) and (strokes>5) and (strokes<12):
        R = ds[rows]
        T = ds[rows+1]
        columns = 0
        for p in img:
            L = len(p[0])
            R[columns:columns+L] = p[0]
            T[columns:columns+L] = p[1]
            columns += L
        maxColumns = max(maxColumns, columns)
        rows += 2
    if rows >= 2*PATTERNS : 
        break
ds = np.reshape(ds, [-1, 2*POINTS])
print('rows/columns:', rows, ', ', maxColumns)
np.savetxt('bed.csv', ds, delimiter='|', fmt='%d')
