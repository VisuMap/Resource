import numpy as np
import tensorflow as tf
import ModelUtil as mu


def AddMissing(ds, missingRatio, randomSeed=-1):
    if randomSeed>0: 
        tf.set_random_seed(randomSeed)
        np.random.seed(randomSeed)
    ds.D = ds.X
    ds.Mask = np.random.choice(np.array([0, 1], dtype=np.float32), 
        size=ds.D.shape, p=[missingRatio, 1-missingRatio])
    ds.X = ds.D * ds.Mask   # masked data
    ds.Y = ds.Mask          # data mask
    ds.Weight = ds.Mask.shape[0] * ds.Mask.shape[1] - np.sum(ds.Mask)   # The number of missing values
    ds.UpdateAux()
    return ds

def AddMissing2(D, missingRatio, randomSeed=-1):
    if randomSeed>0: np.random.seed(randomSeed)
    return D * np.random.choice(np.array([0, 1], dtype=np.float32), 
        size= D.shape, p=[missingRatio, 1-missingRatio])

def SaveMiss(ds, modelName):
    if not modelName.startswith('<NotSave>'):
        np.savetxt(modelName + '.mis', ds.X, delimiter='|', fmt='%.8f')

def MaskedError(ds, imputed):
    total = np.sum(np.abs(imputed - ds.D) * (1-ds.Mask))
    return 100.0*total/ds.Weight

def LearningError(ds, imputed):
    total = np.sum(np.abs(imputed - ds.D) * ds.Mask)
    return 100.0*total/ds.Weight

def GetMeanError(ds, byColumn=True):
    if byColumn:
        meanV = np.sum(ds.X, axis=0) / np.sum(ds.Mask, axis=0)
    else:
        meanV = np.sum(ds.X, axis=1) / np.sum(ds.Mask, axis=1)
        meanV = np.reshape(meanV, [-1, 1])
    imputed = (1-ds.Mask) * meanV
    return MaskedError(ds, imputed)

def AddSection(top, nameScop, lastFct):
    vList = [v for v in tf.global_variables() if v.name.startswith(nameScop)]
    for v in vList:
        if v.name.endswith('mx:0'):
            top = tf.matmul(top, v)
        elif v.name.endswith('bias:0'):
            fct = lastFct if v is vList[-1] else tf.nn.leaky_relu
            top = fct(top + v)
    return top    

def GetRegressionError(ds):
    rows = ds.X.shape[0]
    columns = ds.X.shape[1]
    imputed = np.copy(ds.X)
    for row in range(rows):
        X = imputed[row]
        ii = np.reshape(np.argwhere(ds.Mask[row]), [-1])
        L = len(ii)
        for k in range(1, L):
            k0, k1 = ii[k-1], ii[k]
            steps = k1 - k0
            if steps > 1:
                delta = (X[k1] - X[k0])/steps
                for i in range(k0 + 1, k1):
                    X[i] = X[i-1] + delta
        for i in range(ii[0]): X[i] = X[ii[0]]
        for i in range(ii[L-1]+1, columns): X[i] = X[ii[L-1]]
    return MaskedError(ds, imputed)




