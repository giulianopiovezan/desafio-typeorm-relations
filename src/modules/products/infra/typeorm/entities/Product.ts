import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import AppError from '@shared/errors/AppError';

import OrdersProducts from '@modules/orders/infra/typeorm/entities/OrdersProducts';

@Entity('products')
class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal')
  price: number;

  @Column('integer')
  quantity: number;

  @OneToMany(_ => OrdersProducts, ordersProducts => ordersProducts.product)
  order_products: OrdersProducts[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  hasStock(qnt: number): boolean {
    return qnt <= this.quantity;
  }

  updateStock(qnt: number): void {
    if (!this.hasStock(qnt)) {
      throw new AppError(`Product ${this.id} without stock`);
    }

    this.quantity -= qnt;
  }
}

export default Product;
