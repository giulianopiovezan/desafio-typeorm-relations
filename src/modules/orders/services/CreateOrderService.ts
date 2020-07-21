import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const findCustomer = await this.customersRepository.findById(customer_id);

    if (!findCustomer) {
      throw new AppError('Customer does not exist!');
    }

    const productsIds = products.map(product => ({ id: product.id }));

    const findProducts = await this.productsRepository.findAllById(productsIds);

    if (findProducts.length !== products.length) {
      throw new AppError('There are products that does not exists');
    }

    const orderProducts = findProducts.map(product => {
      const newProduct = products.find(
        findProduct => findProduct.id === product.id,
      );

      if (!newProduct) {
        throw new AppError(`Product ${product.id} not found`);
      }

      if (!product.hasStock(newProduct.quantity)) {
        throw new AppError(
          `Product ${newProduct.id} does not have stock (available stock: ${product.quantity})`,
        );
      }

      return {
        product_id: newProduct.id,
        quantity: newProduct.quantity,
        price: product.price,
      };
    });

    const order = await this.ordersRepository.create({
      customer: findCustomer,
      products: orderProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
