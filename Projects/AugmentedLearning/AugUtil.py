#=======================================================================
# File: AugUtil.py
#
# Help functions and classes to facilitate creation of augmented 
# learning models.
#=======================================================================
from ModelUtil import ModelDataset
import numpy as np
import tensorflow as tf
import math, random, time
from random import shuffle

#==================================================================
# Base class for AugDataset* classes
#===================================================================
class AugDataset0:
    aug = None    # the values of augmented variables for each dataset.
    augTensor = None # the tensor variable for the augented variables.
    augDim = 0
    augVar1 = None
    augVar2 = None
    var1Dim = 0
    var2Dim = 0
    md = None

    def __init__(self):
        pass

    def InitAug(self, N, augVar):
        if augVar == None: 
            return
        if isinstance(augVar, tf.Variable):
            self.augVar1 = augVar
        else:
            augVar = [x for x in augVar if x is not None]
            if len(augVar) >= 1:
                self.augVar1 = augVar[0]
            if len(augVar) >= 2:
                self.augVar2 = augVar[1]
            elif len(augVar) >= 3:
                print('More than two augment variable not supported')
                return
        if self.augVar1 == None:
            return
        
        if self.augVar2 == None:
            self.augTensor = self.augVar1
        else:
            self.augTensor = tf.concat([self.augVar1, self.augVar2], axis=0)
        
        if self.augVar1 is not None:
            self.var1Dim = int(self.augVar1.shape[0])
        if self.augVar2 is not None:
            self.var2Dim = int(self.augVar2.shape[0])
        self.augDim = self.var1Dim + self.var2Dim

        self.aug = np.zeros([N, self.augDim], np.float32)
    
    def PushAug(self, augIdx):
        if self.augVar1 is not None:
            self.augVar1.load(self.aug[augIdx, :self.var1Dim], self.md.sess)
        if self.augVar2 is not None:
            self.augVar2.load(self.aug[augIdx, self.var1Dim:], self.md.sess)

    def PushFeed(self, augIdx):
        if self.var2Dim == 0:
            return {self.augVar1:self.aug[augIdx]}
        else:
            return {self.augVar1:self.aug[augIdx,:self.var1Dim], self.augVar2:self.aug[augIdx, self.var1Dim:] }

    def PushFeed0(self, augVector):
        if self.var2Dim == 0:
            return {self.augVar1:augVector}
        else:
            return {self.augVar1:augVector[:self.var1Dim], self.augVar2:augVector[self.var1Dim:] }

    def PullAug(self, augIdx):
        if self.aug is not None:
            self.aug[augIdx] = self.md.sess.run(self.augTensor)

    def SaveAugment(self, modelName):  
        if (self.aug is None) or  modelName.startswith('<NotSave>'):
            return

        np.savetxt(modelName + '.aug', self.aug, delimiter='|', fmt='%.8f')
        var2Name = self.augVar2.name if (self.augVar2 != None) else ''
        self.md.modelInfo.update({'AugVar1':self.augVar1.name, 'AugVar2':var2Name, 
                                  'Var1Dim':self.var1Dim, 'Var2Dim':self.var2Dim,
                                  'AugDim':self.augDim, 'AugLen':self.aug.shape[0]})

#==================================================================
# Class to augment list of dataset with learnable input variables
#===================================================================

class AugDataset(AugDataset0):
    r"""
      Prepare a single dataset for augmented learning:
      A whole row will be returned in each batch as label; no input 
      data will be returned; 
    """
    Y = None
    Columns = 0
    rowIdx = 0
    N = 0
    epochs = 0

    def __init__ (self, ds, md, augVar=None):
        self.N = ds.Y.shape[0]
        self.Columns = ds.Y.shape[1]
        self.Y = np.reshape(ds.Y, [self.N, 1, self.Columns])
        self.rowMap = np.arange(self.N)
        self.md = md
        md.batchSize = 1
        self.InitAug(self.N, augVar)

    def InitEpoch(self, batchSize, randomizing):
        if self.epochs > 0:
            # save the augument for the last row of last epoch.
            self.PullAug(self.rowMap[self.N-1])
        np.random.shuffle(self.rowMap)
        self.epochs += 1
        self.rowIdx = 0
        
    def Eval(self):
        m = np.zeros([self.N, self.Columns], dtype=np.float32)
        v = self.md.GetVariable('PhenoMap')
        for i in range(self.N):
            m[i] = self.md.sess.run(v,  self.PushFeed(i))[0]
        return m

    def HasMoreData(self):
        return self.rowIdx < self.N

    def NextBatch(self):
        rIdx = self.rowMap[self.rowIdx]
        if self.rowIdx >= 1:
            self.PullAug(self.rowMap[self.rowIdx-1])
        self.PushAug(rIdx)
        self.rowIdx += 1
        return None, self.Y[rIdx]

#==================================================================
# Prepare a single dataset for augmented learning with 1-*-1 architecture.
#===================================================================

class AugDataset2(AugDataset0):
    r"""
      Prepare a single dataset for augmented learning with 1-*-1 architecture. Each batch contains
      a randomly selected subset of columns of input data and label data reshaped as a list of [1,1]
      shaped pairs.
    """
    X = None
    Y = None
    Columns = 0
    rowIdx = 0
    colIdx = 0
    N = 0
    epochs = 0

    def __init__ (self, ds, md, augVar=None, freq=5.5):
        self.N = ds.X.shape[0]
        self.Columns = ds.X.shape[1]
        self.Y = np.reshape(ds.X, [-1, self.Columns, 1])
        self.X = Make3DReference(self.Columns, freq)
        self.colMap = np.arange(self.Columns)
        self.rowMap = np.arange(self.N)
        self.md = md
        self.epochs = 0
        self.InitAug(self.N, augVar)

    def InitEpoch(self, batchSize, randomizing):
        if self.epochs > 0:
            # save the last aug vector of the previouse epochs
            self.PullAug(self.rowMap[self.N-1])
        np.random.shuffle(self.rowMap)
        np.random.shuffle(self.colMap)
        self.epochs += 1
        self.rowIdx = 0
        self.colIdx = 0
        self.curY = self.Y[self.rowMap[0]]
        self.PushAug(self.rowMap[0])
        
    def Eval(self):        
        pred = np.empty([self.N, self.Columns], dtype=np.float32)
        vMap = self.md.GetVariable('PhenoMap')
        feed= {self.md.inputHod : self.X }
        for k in range(self.N):
            feed.update( self.PushFeed(k) )
            pred[k] = self.md.sess.run(vMap,  feed).flatten()
        return pred

    def HasMoreData(self):
        if self.colIdx >= self.Columns:
            return (self.rowIdx+1) < self.N
        else:
            return self.rowIdx < self.N

    def NextBatch(self):
        if self.colIdx >= self.Columns:
            self.PullAug(self.rowMap[self.rowIdx])
            self.rowIdx += 1
            rIdx = self.rowMap[self.rowIdx]
            self.PushAug(rIdx)
            self.curY = self.Y[rIdx]
            self.colIdx = 0            
        bSize = min(self.md.batchSize, self.Columns - self.colIdx)
        idxList = self.colMap[self.colIdx:(self.colIdx+bSize)]    
        bX = np.take(self.X, idxList, 0)
        bY = np.take(self.curY, idxList, 0)        
        self.colIdx += bSize
        return bX, bY

#==================================================================
# Created a augmented dataset from a list of datasets.
#===================================================================

class AugDataset3(AugDataset0):
    X = None
    Y = None
    Ys = None # The list of Ys in all datasets.
    batchSize = 0

    dsIdx = 0     # dsMap[dsIdx] is the index of the current dataset.
    dsIdx2 = 0    # short cut for dsMap[dsIdx]
    dsMap = None  # help array to shuffle the dataset indexes. 

    cuMap = None
    cuIdx = 0
    cuN = 0
    N = 0
    epochs = 0

    def __init__ (self, dsList, md, augVar=None):
        dsN = len(dsList)
        self.Ys = [ dsList[i][1] for i in range(dsN) ]
        self.X = dsList[0][0]
        self.batchSize = md.batchSize
        self.md = md
        self.cuN = self.X.shape[0]
        self.N = dsN * self.cuN

        self.InitAug(dsN, augVar)

        self.dsMap = np.arange(dsN)
        self.cuMap = np.arange(self.cuN)
        self.epochs = 0
        # Only fetch learned aug after first dataset in first epoch:
        self.dsIdx2 = -1

    def Validate(self, cost1, cost2):
        cost = np.zeros([2], np.float32)
        K = len(self.Ys)
        for k in range(K):
            cost += self.md.Validate(self.X, self.Ys[k], self.PushFeed(k), [cost1, cost2])    
        return cost[0], cost[1]

    def Eval(self):
        K =  len(self.Ys)
        sp = self.Ys[0].shape 
        pred = np.empty([K, sp[0] * sp[1]], dtype=np.float32)
        vMap = self.md.GetVariable('PhenoMap')
        feed= {self.md.inputHod : self.X}
        for k in range(K):
            feed.update(self.PushFeed(k))
            pred[k] = self.md.sess.run(vMap,  feed).flatten()
        return pred

    def InitEpoch(self, batchSize, randomizing):
        np.random.shuffle(self.dsMap)
        self.InitDataset(0)
        self.epochs += 1

    def InitDataset(self, dsIndex):
        if self.dsIdx2 >= 0:
            self.PullAug(self.dsIdx2)
        self.dsIdx = dsIndex
        self.dsIdx2 = self.dsMap[self.dsIdx]
        self.Y = self.Ys[self.dsIdx2]
        self.PushAug(self.dsIdx2)

        self.cuN = self.X.shape[0]

        self.cuIdx = 0
        '''
        selectRatio = 0.05
        self.cuIdx = int( (1.0 - selectRatio) * self.cuN )
        self.N = int(selectRatio * self.N)
        '''

        np.random.shuffle(self.cuMap)

    def HasMoreData(self):
        return self.cuIdx < self.cuN

    def NextBatch(self):
        cuIdx2 = min(self.cuIdx+self.batchSize, self.cuN)
        batchIdx = self.cuMap[self.cuIdx : cuIdx2] 
        bX = np.take(self.X, batchIdx, 0)
        bY = np.take(self.Y, batchIdx, 0)
        self.cuIdx = cuIdx2

        if self.cuIdx == self.cuN:
            self.dsIdx += 1
            if self.dsIdx < self.dsMap.shape[0]: 
                self.InitDataset(self.dsIdx)
        return bX, bY


#==================================================================
# Created a augmented dataset from a dataset and mask for missing data.
#===================================================================
class AugDatasetMasked(AugDataset0):
    r"""
      Prepare a single dataset for augmented learning:
      The a whole row will be returned in each batch as label; input and
      output data are the masked data and the data mask (for missing values)
      respectively.
    """
    X = None  # The data mask
    Y = None  # The masked data
    Columns = 0
    rowIdx = 0
    N = 0
    epochs = 0

    def __init__ (self, ds, md, augVar=None):
        self.N = ds.Y.shape[0]
        self.Columns = ds.Y.shape[1]
        self.X = np.reshape(ds.X, [self.N, 1, self.Columns])
        self.Y = np.reshape(ds.Y, [self.N, 1, self.Columns])
        self.rowMap = np.arange(self.N)
        self.md = md
        md.batchSize = 1
        self.InitAug(self.N, augVar)

    def InitEpoch(self, batchSize, randomizing):
        if self.epochs > 0:
            # save the augument for the last row of last epoch.
            self.PullAug(self.rowMap[self.N-1])
        np.random.shuffle(self.rowMap)
        self.epochs += 1
        self.rowIdx = 0

    def HasMoreData(self):
        return self.rowIdx < self.N

    def NextBatch(self):
        rIdx = self.rowMap[self.rowIdx]
        if self.rowIdx >= 1:
            self.PullAug(self.rowMap[self.rowIdx-1])
        self.PushAug(rIdx)
        self.rowIdx += 1
        return self.X[rIdx], self.Y[rIdx]
