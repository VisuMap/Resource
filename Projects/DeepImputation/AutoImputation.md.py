#=========================================================================
# Data Imputation With Autoencoder Network.
#=========================================================================
from ImputeUtil import *

co = mu.CmdOptions()
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder(job = co.job)

co.SP500 = 5*[250],         0.002,          0.85,       False
co.MNIST = 7*[250],         0.0005,         0.85,       True
co.DAPL  = 4*[700],         0.0003,         0.8,        False
co.EHCA  = 2*[150],         0.0003,         0.8,        False
co.Test  = 7*[250],         0.0005,         0.85,       True

netCfg, md.r0, md.decay, doTrans = co.Test

if co.MNIST: ds.X = np.transpose(ds.X)
ds = AddMissing(ds, 0.5, co.job)
#========================================

md.batchSize = 1
md.InitModel(ds.xDim, ds.xDim)
md.AddLayers(netCfg)
md.AddLayers(ds.yDim, activation=tf.nn.sigmoid)
md.cost = md.SquaredCost(md.Label()*md.Output(),  md.Input())

md.log.CfgHistogram(3, 'Imputation Error (%)', 0)
imputeError = 0
def EpochCall(ep):
    global imputeError
    md.log.ReportCost(ep, md.lastError, co.job)
    imputed = md.Eval(ds.X)
    #md.log.ShowMatrix(imputed, view=1, access='r', title='Decoder Output: %d'%co.job)
    imputeError = MaskedError(ds, imputed)
    md.log.ExtHistogram(3, imputeError, co.job)
    return False 
    
md.SetAdamOptimizer(co.epochs, ds.N)
md.Train(ds, co.epochs, co.logLevel, co.refreshFreq, epCall=EpochCall)
md.modelInfo.update({'Algorithm':'AutoImputation', 'netCfg':netCfg, 'epochs':co.epochs, 'ImputeError':imputeError})
SaveMiss(ds, co.modelName)
md.Save(co.modelName)