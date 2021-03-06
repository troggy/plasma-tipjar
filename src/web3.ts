import { observable, action } from 'mobx';
import Web3Type from 'web3';
import { ExtendedWeb3, helpers } from 'leap-core';
import Web3 from './web3_ts_workaround';

export default class Web3Store {
  @observable.ref
  public injected: Web3Type | null = null;

  @observable.ref
  public local: ExtendedWeb3;

  @observable
  public injectedAvailable = false;

  @observable
  public approved = false;

  @observable
  public injectedReady = false;

  constructor() {
    this.local = helpers.extendWeb3(new Web3(
      new Web3.providers.HttpProvider('http://node1.testnet.leapdao.org:8645')
    ));

    const { ethereum, web3 } = window as any;
    const metamask = ethereum && ethereum._metamask; // eslint-disable-line no-underscore-dangle

    this.injectedAvailable = !!(ethereum || web3);
    if (metamask) {
      setTimeout(() => {
        if (metamask.isEnabled()) {
          this.updateInjected(ethereum);
        } else {
          metamask.isApproved().then(approved => {
            this.updateInjected(approved ? ethereum : null, approved);
          });
        }
      }, 500);
    } else if (web3) {
      this.updateInjected(web3.currentProvider);
    } else {
      this.updateInjected(null, false);
    }
  }

  @action
  private updateInjected(provider, approved = true) {
    this.injectedReady = true;
    this.approved = approved;
    if (provider) {
      this.injected = new Web3(provider);
    }
  }

  public enable() {
    const { ethereum } = window as any;
    const metamask = ethereum && ethereum._metamask; // eslint-disable-line no-underscore-dangle

    if (!metamask) {
      throw new Error('Only for EIP-1102 compilant metamask');
    }

    ethereum
      .enable()
      .then(() => {
        this.injected = new Web3(ethereum);
        this.approved = true;
      })
      .catch(() => {});
  }
}
