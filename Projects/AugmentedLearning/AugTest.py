#==========================================================================================
# File: AugTest.py
#
# Miscellaneous help functions to test augmented learning
#==========================================================================================
import numpy as np
import math, random, time

def Rotate(m, a, rAxis=2):
    c = np.median(m, axis=0)
    cosA = math.cos(a)
    sinA = math.sin(a)
    if m.shape[1] == 3:
        if rAxis==2:
            R = np.array([[cosA, -sinA, 0], [sinA, cosA, 0], [0,0,1]], dtype=np.float32 )
        elif rAxis==1:
            R = np.array([[cosA, 0, -sinA], [0,1,0], [sinA, 0, cosA]], dtype=np.float32 )
        else:
            R = np.array([[1,0,0], [0, cosA, -sinA], [0, sinA, cosA]], dtype=np.float32 )
    else:
        R = np.array([ [cosA, -sinA], [sinA, cosA] ], dtype=np.float32 )
    R = np.transpose(R)
    return np.matmul(m-c, R)+c

def Scale(m, s):
    c = np.mean(m, axis=0)
    return s * (m - c) + c

def MergeDatasets(dsList):
    inAll = np.concatenate([ d[0] for d in dsList ])
    outAll = np.concatenate([ d[1] for d in dsList ])
    return [(inAll, outAll)]

def MergeDatasetList(dsList, ds):
    ds.X = np.concatenate([ d[0] for d in dsList ])
    ds.Y = np.concatenate([ d[1] for d in dsList ])
    ds.UpdateAux()
    return ds

def aRange(K):
    return [2*math.pi*k/K for k in range(K)]

def RotateX(X, Aug, K):
    X = Scale(X, 0.3)
    dsList = []
    N, yDim = X.shape[0], Aug.shape[1]
    for k, a in enumerate(aRange(K)):
        XX = Rotate(X, a)
        XX += 0.30 * np.array([math.cos(a), math.sin(a), 0], dtype=np.float32)
        YY = np.full((N, yDim), Aug[k,:], dtype=np.float32)
        dsList.append((XX,YY))
    return dsList

def RandomBall(D):
    c = np.median(D, axis=0)

    a = random.uniform(0, 2*math.pi)
    cosA = math.cos(a)
    sinA = math.sin(a)
    R0 = np.array([[cosA, -sinA, 0], [sinA, cosA, 0], [0,0,1]], dtype=np.float32 )

    a = random.uniform(0, 2*math.pi)
    cosA = math.cos(a)
    sinA = math.sin(a)
    R1= np.array([[cosA, 0, -sinA], [0,1,0], [sinA, 0, cosA]], dtype=np.float32 )

    a = random.uniform(0, 2*math.pi)
    cosA = math.cos(a)
    sinA = math.sin(a)
    R2 = np.array([[1,0,0], [0, cosA, -sinA], [0, sinA, cosA]], dtype=np.float32 )

    R = np.transpose(np.matmul(np.matmul(R0, R1), R2))

    s = random.uniform(0.1, 1.2)
    X = s*np.matmul(D-c, R)+c
    X = 0.3*X+np.random.uniform(0,0.7,[3])
    return X

def Trans0(D, K, tType=0):
    if tType == 16:
        dsList = []
        L = len(D)//2
        D1, D2 = D[:L], D[L:]
        c = np.mean(D2, axis=0)
        K3 = K//3
        for a in aRange(K3):
            X = 0.25*(D2-c) + c
            X = Rotate(X, a, rAxis=2)
            dsList.append( np.concatenate((D1, X), axis=0) )
        for k in range(K3):
            s =  1.25*k/K3 + 0.25
            X = s*(D2-c) + c 
            dsList.append( np.concatenate((D1, X), axis=0) )
        for a in aRange(K3):
            X = 1.25*(D2-c) + c
            X = Rotate(X, a, rAxis=1)
            dsList.append( np.concatenate((D1, X), axis=0) )
        return dsList

    # scaling co-centered ball.
    if tType == 15:  
        dsList = []
        L = len(D)//2
        D1, D2 = D[:L], D[L:]
        for a in aRange(K):
            X = Rotate(D1, a)
            dsList.append( np.concatenate((D2, X), axis=0) )
        return dsList

    # scaling co-centered ball.
    if tType == 14:  
        dsList = []
        L = len(D)//2
        D1, D2 = D[:L], D[L:]
        c = np.mean(D1, axis=0)
        for k in range(K):
            s = 1.0 + 0.75*k/K 
            X = s * (D1 - c) + c
            dsList.append( np.concatenate((D2, X), axis=0) )
        return dsList

    # shift the left ball
    if tType == 13:  
        dsList = []
        L = len(D)//2
        D1, D2 = D[:L], D[L:]
        c12 = np.mean(D2, axis=0) - np.mean(D1, axis=0)
        for k in range(K):
            X = D2 - k/K*c12
            dsList.append( np.concatenate((D1, X), axis=0) )
        return dsList

    # scale the left ball.
    if tType == 12:  
        dsList = []
        L = len(D)//2
        D1, D2 = D[:L], D[L:]
        c = np.mean(D2, axis=0)
        for k in range(K):
            s =  1.25 * k/K + 0.25
            X = s*(D2-c) + c 
            dsList.append( np.concatenate((D1, X), axis=0) )
        return dsList

    # rotate a single for 0.65 * 2*pi angle
    if tType == 11:
        dsList = []
        D = Scale(D, 0.3)
        for a in aRange(K):
            a *= 0.65
            X = Rotate(D, a)
            X += 0.30 * np.array([math.cos(a), math.sin(a), 0], dtype=np.float32)
            dsList.append(X)
        return dsList

    # Rotate the left ball along given axis
    if (tType >= 8) and (tType<=10):
        dsList = []
        L = len(D)//2
        D1, D2 = D[:L], D[L:]
        axis = tType - 8
        for a in aRange(K):
            rd = Rotate(D2, a, rAxis=axis)
            dsList.append( np.concatenate((D1, rd), axis=0) )
        return dsList

    # Random shift
    if tType == 7:
        dsList = []
        for k in range(K):
            dsList.append(RandomBall(D))
        return dsList

    # simple shifting
    if tType == 6:
        return [ 0.3*D+3*[0.7*k/K] for k in range(K) ]

    if (tType>=3) and (tType<6):
        return [ Rotate(D, a, rAxis=tType-3) for a in aRange(K) ]

    if tType == 17:
        K = 30
        dsList = [ 0.3*D+3*[0.7*k/K] for k in range(K) ]
        D = dsList[-1]
        for a in aRange(K):
            dsList.append(Rotate(D, a, rAxis=2))
        return dsList

    if tType<3:
        dsList = []
        D = Scale(D, 0.3)
        for a in aRange(K):
            if tType==0:
                X = np.copy(D)
            elif tType==1:
                X = Rotate(D, a)
            else:
                c = np.median(D, axis=0)
                X = np.copy(D) - c
                X[:,0] *= abs(math.cos(a))*0.9 + 0.1
                X += c
            X += 0.30 * np.array([math.cos(a), math.sin(a), 0], dtype=np.float32)
            dsList.append(X)
    return dsList
    
def TransY(X, Y, K, tType=0):
    return [(X, Y) for Y in Trans0(Y, K, tType)]

def ShowDatasetList(dsList, log):
    print('Datasets: ', len(dsList))
    for k, d in enumerate(dsList): 
        print(k, ': ', d[0].shape, '->', d[1].shape)
        log.ShowMatrix(d[1]*750.0, view=13, access='r', title='k: %d'%k,)
        time.sleep(0.25)

def Make3DReference(rows, freq):
    R = np.empty([rows, 3], dtype=np.float32)
    for i in range(rows):
        t = i/rows
        a = freq * t * 2 * math.pi
        R[i] = [math.sin(a), math.cos(a), 2*t - 1.0]
    return R

# Convert a single data table to list of in-out dataset list. Each row will be 
# reshaped to a dataset table.
def TableToList(X, columns, freq):
    rows = X.shape[1]//columns
    Z = np.reshape(X, [-1, rows, columns])
    #R = np.mean(Z, axis=0)
    R = Make3DReference(rows, freq)
    return [(R, Z[i]) for i in range(X.shape[0])]

#=================================================================

#Show datasets as single table with one row for each dataset.
def ShowDatasetList2(dsList, log):
    dss = np.array([d[1] for d in dsList])
    log.ShowMatrix(np.reshape(dss, [-1, dsList[0][1].size]), view=8)
    log.RunScript('pp.Reset().Start()')

def LoadMapList(mapList, log):
    X, Y = log.OpenDataset(mapList[0], target='Shp', dataGroup=3)
    dsList = [(X, Y)]
    for map in mapList[1:]:
        dsList.append( (X, log.OpenDataset(map, target='Shp', dataGroup=2)[1]) )
    return X, Y, dsList

def LoadTransMap(K, typeList, log):
    X, Y = log.OpenDataset('', target='Shp', dataGroup=3, tmout=60)
    dsList = sum([TransY(X, Y, K, t) for t in typeList], [] ) 
    return X, Y, dsList


