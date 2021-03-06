import * as React from 'react';
import { observable, decorate, computed } from 'mobx';
import { observer, inject } from 'mobx-react';
import ItemsStore from './itemsStore';
import TokenAmount from './tokenAmount';
import Account from './account';
import Balance from './balance';

type TipJarProps = {
  address: string;
  items?: ItemsStore;
  account?: Account;
};

class TipJar extends React.Component<TipJarProps, any> {

  public get item() {
    if (this.props.items) {
      return this.props.items.itemByAddress(this.props.address);
    }

    return undefined;
  }

  public amount = 0;
  public sending = false;

  public addAmount(add) {
    const { account } = this.props;
    const cents = Balance.toCents((this.amount + add));

    if (account.balance && typeof account.balance.value === 'number') {
      this.amount = Balance.toTokens(Math.min(Math.max(cents, 0), account.balance.value));
    } else {
      this.amount = Balance.toTokens(Math.max(cents, 0));
    }
  }

  public handleSubmitClick(e: React.MouseEvent<any>) {
    const button = e.currentTarget;
    this.sending = true;
    this.item.tip(this.amount).then(() => {
      this.amount = 0;
      button.blur();
      this.sending = false;
    }).catch(() => {
      this.sending = false;
    });
  }

  public render() {
    if (!this.item) {
      return null;
    }

    return (
      <form className="jar" tabIndex={0}>
        <div className="jar-amount">
          <button type="button" onClick={() => this.addAmount(-0.1)}>
            <span>−</span>
          </button>

          <div>{this.amount}</div>

          <button type="button" onClick={() => this.addAmount(+0.1)}>
            <span>+</span>
          </button>
        </div>
        <button
          className="jar-cover"
          type="button"
          onClick={(e) => {
            this.handleSubmitClick(e);
          }}
          disabled={this.sending}
        >
          {this.sending ? '...' : 'Put in the jar'}
        </button>
        <div className="jar-body">
          <div className="jar-total"><TokenAmount amount={this.item.balance.value} /></div>
          <h3>{this.item.name}</h3>
          <p>{this.item.roles}</p>
        </div>
      </form>
    );
  }
}

decorate(TipJar, {
  amount: observable,
  sending: observable,
  item: computed,
});

export default inject('items', 'account')(observer(TipJar));