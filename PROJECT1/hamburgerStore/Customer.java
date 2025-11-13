package hamburgerStore;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.Set;

public class Customer {

   private FileWriter fw;
   private String folderPath = "transactions";
   private static int dailyCustomerCount = 0;
   private int customerId = ++dailyCustomerCount;
   private Map<Ingredient, Integer> product; // 완성된 상품
   private Map<Ingredient, Integer> drink;
   private int iCount; // 유저가 선택한 재료 개수
   private int dCount; // 유저가 선택한 재료 개수
   private String menuPan = "\033[92m재료 이름을 입력> \033[0m"; // 굳이 필요없음
   
   public Customer() {
      File folder = new File(folderPath);

      // 폴더가 없으면 생성
      if (!folder.exists()) {
         boolean success = folder.mkdirs(); // 상위 폴더까지 전부 생성
         if (!success) {
            System.out.println("폴더 생성 실패!");
         }
      }
   }

   public void customerMain(Scanner scan, List<Ingredient> ingredientList, LocalDateTime localDateTime){
      product = new HashMap<>();
      drink = new HashMap<>();
      String execution = "n";
      while (!execution.equals("y")) {

         System.out.println(menuPan);
         String ingredient = scan.nextLine();
         boolean check = false;
         for (Ingredient i : ingredientList) {
            if (i.getName().equals(ingredient)) {
               if (i.getKind() == 1) {
                  System.out.println("개수를 입력>");
                  try {
                     iCount = scan.nextInt();
                     scan.nextLine();
                     System.out.println();
                     while (iCount < 0) {
                        System.err.println("0보다 큰 수를 입력>");
                        iCount = scan.nextInt();
                        scan.nextLine();
                        System.out.println();
                     }
                  } catch (Exception e) {
                     // TODO: handle exception
                     System.err.println("숫자만 입력하세요");
                     System.out.println();
                  }
                  if (i.getStock() >= iCount) {
                     product.put(i, iCount);
                     i.setSaleCount(i.getSaleCount() + iCount);
                     i.setStock(i.getStock() - iCount);
                  } else {
                     System.out.println("재고가 부족합니다.");
                     System.out.println();
                  }
               } else {
                  System.out.println("개수를 입력>");
                  try {
                     dCount = scan.nextInt();
                     scan.nextLine();
                     System.out.println();
                     while (dCount < 0) {
                        System.err.println("0보다 큰 수를 입력>");
                        dCount = scan.nextInt();
                        scan.nextLine();
                        System.out.println();
                     }
                  } catch (Exception e) {
                     // TODO: handle exception
                     System.out.println("숫자만 입력하세요");
                     System.out.println();
                  }
                  if (i.getStock() >= dCount) {
                     drink.put(i, dCount);
                     i.setSaleCount(i.getSaleCount() + dCount);
                     i.setStock(i.getStock() - iCount);
                  } else {
                     System.out.println("재고가 부족합니다.");
                     System.out.println();
                  }
               }
               check = true;
            }
         }
         if (check == false && !ingredient.equals("")) {
            System.out.println("해당 재료가 없습니다.");
            System.out.println();
         }

         System.out.println("결제하시겠습니까? (y) > ");
         execution = scan.nextLine();
         System.out.println();

         // 종료시 실행구문
         if (execution.toLowerCase().equals("y")) {
            // 파일에 영수증 담기
            if (product.size() != 0) {

               try {
                  DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                  String formattedNow = localDateTime.format(formatter);
                  fw = new FileWriter(folderPath + "\\" + formattedNow + ".txt", true);
                  
                  System.out.println("=====구매 내역=====");
                  fw.write(customerId + "\n");
                  int sum = 0; // 총 액;
                  for (Ingredient i : product.keySet()) {
                     String ing = String.format("%-3s x ", i.getName()).replace(' ', '\u3000') + String.format("%,3d", product.get(i));
                     sum += i.getSale() * product.get(i);
                     fw.write(ing + "\n");
                     System.out.println(ing + String.format(" = %,8d", (i.getSale() * product.get(i))));
                  }
                  for (Ingredient i : drink.keySet()) {
                     String dri = String.format("%-3s x ", i.getName()).replace(' ', '\u3000') + String.format("%,3d", drink.get(i));
                     sum += i.getSale() * drink.get(i);
                     fw.write(dri + "\n");
                     System.out.println(dri + String.format(" = %,8d", (i.getSale() * drink.get(i))));
                  }
                  System.out.println("===================");
                  fw.write("합계 : " + sum + "\n");
                  formatter = DateTimeFormatter.ofPattern("HH:mm:ss\n\n");
                  formattedNow = localDateTime.format(formatter);
                  fw.write("결제시간 : " + formattedNow);
                  fw.close();
                  System.out.println("합계 : " + sum);
                  System.out.println("대기번호 : " + customerId);
                  System.out.println();
               } catch (Exception e){
                  System.out.println("파일을 불러올 수 없습니다.");
               }
               
            } else {
               System.out.println("장바구니가 비어있습니다.");
               System.out.println();
            }
            break;
         }
      }
   }
   
   public void nextDate(List<Ingredient> list, LocalDateTime now) {
      dailyCustomerCount = 0;

      DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
      String formattedNow = now.format(formatter);

      int cnt = ((int)(Math.random() * 100) + 70);
      try (FileWriter fw = new FileWriter(folderPath + "\\" + formattedNow + ".txt", true)){
         for (int i = 0; i < cnt; i++) {
            Customer customer = new Customer();
            fw.write(customer.customerId + "\n");
            
            System.out.println("=====구매 내역=====");
            Set<Ingredient> set = new HashSet<>();
            int sum = 0;
            for (int j = 0; j < (int)(Math.random() * (list.size() - 1)) + 1; j++) {
               Ingredient ingredient = list.get((int)(Math.random() * list.size()));
               int count = (int)(Math.random() * 5) + 1;
               if (ingredient.getStock() >= count && !set.contains(ingredient)) {
                  set.add(ingredient);
                  ingredient.setSaleCount(ingredient.getSaleCount() + count);
                  ingredient.setStock(ingredient.getStock() - count);
                  String ing = String.format("%-3s x ", ingredient.getName()).replace(' ', '\u3000') + String.format("%,3d", count);
                  sum += ingredient.getSale() * count;
                  fw.write(ing + "\n");
                  System.out.println(ing + String.format(" = %,8d", (ingredient.getSale() * count)));
               }
            }
            formatter = DateTimeFormatter.ofPattern("HH:mm:ss\n\n");
            formattedNow = now.format(formatter);
            fw.write("합계 : " + sum + "\n");
            fw.write("결제시간 : " + formattedNow);
            System.out.println("===================");
            System.out.println("합계 : " + sum);
            System.out.println("대기번호 : " + customer.customerId);
            System.out.println();
         }
         
      } catch (IOException e) {
         System.out.println("파일을 불러올 수 없습니다.");
      }
   }
}