#=========================================================================
# Create MDS maps with augmented learning model 
#=========================================================================
import ModelUtil as mu
import numpy as np
import tensorflow as tf
from AugUtil import AugDataset3
from DataUtil import *

co = mu.CmdOptions()
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder(job = co.job)

co.MouseHeart = 10, 1*[150], 0.8-0.05*co.job, 0.001
co.MouseTr = 10, 1*[150], 0.8-0.05*co.job, 0.001
augDim, netCfg, md.decay, md.r0 = co.MouseTr
ds.Y = ds.X

#============================================================
inDim = 100 if co.job==0 else 3
outDim = 100
md.InitModel(inDim, outDim)
augVar = md.AddAugment(aDim=augDim)
md.AddLayers(netCfg)
md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
md.cost = md.SquaredCost(md.Output(), md.Label())
md.batchSize = 25
#============================================================

if inDim == 3:
    rows = math.ceil(ds.Y.shape[1]/outDim)
    R = Make3DReference(rows , 5.5)
else:
    R = 10.0 * np.max(ds.X, axis=0)
    R = RowToTable(R, inDim)

dsList = RefTable2List(R, ds.Y, outDim)
ds2 = AugDataset3(dsList, md, augVar)

#============================================================

def EpochCall(ep):
    md.log.ShowMatrix(ds2.aug, view=2, access='r', 
        viewIdx=co.job, title='%d: %d, %f'%(co.job, ep, md.lastError))
    return True

md.SetAdamOptimizer(co.epochs, ds2.N)
md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, EpochCall)
ds2.SaveAugment(co.modelName)
md.Save(co.modelName)