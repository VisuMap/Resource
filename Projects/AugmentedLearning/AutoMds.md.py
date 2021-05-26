#=========================================================================
# Using autoencoder graph to perform MDS services
#=========================================================================
import ModelUtil as mu
import tensorflow as tf
import numpy as np

co = mu.CmdOptions()
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder(ds.xDim, ds.xDim, co.job)

ds.Y = ds.X
co.GEOD = 0.001,  0.8,  0.001,  [400,50,ds.mapDim,80,400,ds.xDim]
L = [300,250,200,150,100,50,25]
co.MouseHeart = 0.001, 0.8, 0.0015,  L+[ds.mapDim]+L[::-1]+[ds.xDim]
regBias, md.decay, md.r0, netCfg = co.MouseHeart
md.batchSize = 100

ii = netCfg.index(ds.mapDim)+1
md.AddLayers(netCfg[:ii])
xyz = tf.identity(md.Output(), name='xyz')
md.AddLayers(netCfg[ii:])

md.cost = md.SquaredCost(md.Output(), md.Label())
# a regulator to attract the coordinates to the middle of the 3D space.
center = tf.constant( np.full([ds.mapDim], 0.5, dtype=np.float32) )
md.cost += regBias * tf.reduce_sum( tf.square(xyz - center) )

md.log.RunScript('vv.GuiManager.RememberCurrentMap();')
def UpdateMap(ep):
    md.log.UpdateMap2(md.Eval2(xyz, ds.X), co.job)     
    return True

md.modelInfo.update({'Algorithm':'Autoencoder', 'netCfg':netCfg, 'mapDim':ds.mapDim})
co.Save(md)
co.Train(md, ds, UpdateMap)
